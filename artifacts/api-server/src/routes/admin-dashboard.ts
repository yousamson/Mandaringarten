import { Router, type ErrorRequestHandler, type IRouter } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { asc, desc, sql } from "drizzle-orm";
import {
  db,
  sitePageViewsTable,
} from "@workspace/db";
import {
  GetAdminDashboardQueryParams,
  GetAdminDashboardResponse,
} from "@workspace/api-zod";
import { hasVerifiedAdministratorEmail, isAdministrator } from "../admin";
import { requireAdminDashboardPasswordSession } from "../admin-dashboard-password";
import {
  fillDailyAppInstallClicks,
  fillDailyPageViews,
  fillDailyRegistrations,
  hongKongDate,
  projectAdminMember,
  shiftCalendarDate,
} from "../admin-dashboard-data";

const router: IRouter = Router();

function allowedSiteOrigins(): Set<string> {
  return new Set([
    "https://www.mandaringarden.asia",
    process.env.REPLIT_DEV_DOMAIN,
    process.env.REPLIT_EXPO_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS ?? "").split(","),
  ].flatMap((value) => {
    if (!value?.trim()) return [];
    try {
      return [new URL(value.match(/^https?:\/\//i) ? value : `https://${value}`).origin];
    } catch {
      return [];
    }
  }));
}

router.post("/analytics/page-view", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.get("origin");
  if (!origin || !allowedSiteOrigins().has(origin)) {
    res.sendStatus(204);
    return;
  }

  try {
    const day = hongKongDate();
    await db.insert(sitePageViewsTable).values({ day, pageViews: 1 }).onConflictDoUpdate({
      target: sitePageViewsTable.day,
      set: { pageViews: sql`${sitePageViewsTable.pageViews} + 1` },
    });
    res.sendStatus(204);
  } catch (error) {
    req.log.error({ err: error }, "Could not record aggregate page view");
    res.sendStatus(204);
  }
});

router.post("/analytics/app-install-click", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "no-store");
  const origin = req.get("origin");
  if (!origin || !allowedSiteOrigins().has(origin)) {
    res.sendStatus(204);
    return;
  }

  try {
    const day = hongKongDate();
    await db.insert(sitePageViewsTable).values({ day, appInstallClicks: 1 }).onConflictDoUpdate({
      target: sitePageViewsTable.day,
      set: { appInstallClicks: sql`${sitePageViewsTable.appInstallClicks} + 1` },
    });
    res.sendStatus(204);
  } catch (error) {
    req.log.error({ err: error }, "Could not record aggregate app install click");
    res.sendStatus(204);
  }
});

async function recentDailyRegistrations(firstDay: string, today: string) {
  const startAt = Date.parse(`${firstDay}T00:00:00.000+08:00`);
  const endAt = Date.parse(`${shiftCalendarDate(today, 1)}T00:00:00.000+08:00`);
  const counts = new Map<string, number>();
  let offset = 0;
  let totalCount = 0;

  do {
    const page = await clerkClient.users.getUserList({
      limit: 500,
      offset,
      orderBy: "-created_at",
      createdAtAfter: startAt - 1,
      createdAtBefore: endAt,
    });
    totalCount = page.totalCount;
    for (const user of page.data) {
      if (user.createdAt < startAt || user.createdAt >= endAt) continue;
      const date = hongKongDate(new Date(user.createdAt));
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }
    if (page.data.length === 0) break;
    offset += page.data.length;
  } while (offset < totalCount);

  return fillDailyRegistrations(
    [...counts].map(([date, registrations]) => ({ date, registrations })),
    today,
    firstDay,
  );
}

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "private, no-store");
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    if (!await isAdministrator(userId)) {
      res.status(403).json({ error: "Administrator access required." });
      return;
    }
    if (!await requireAdminDashboardPasswordSession(userId, req, res)) return;

    const parsed = GetAdminDashboardQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid dashboard page." });
      return;
    }
    const { offset, limit } = parsed.data;
    const today = hongKongDate();
    const firstDay = shiftCalendarDate(today, -29);

    const [users, viewDays, installDays, totals, installTotals, dailyRegistrations] = await Promise.all([
      clerkClient.users.getUserList({ limit, offset, orderBy: "-created_at" }),
      db.select({
        date: sitePageViewsTable.day,
        pageViews: sitePageViewsTable.pageViews,
      }).from(sitePageViewsTable)
        .where(sql`${sitePageViewsTable.day} >= ${firstDay}`)
        .orderBy(asc(sitePageViewsTable.day)),
      db.select({
        date: sitePageViewsTable.day,
        appInstallClicks: sitePageViewsTable.appInstallClicks,
      }).from(sitePageViewsTable)
        .where(sql`${sitePageViewsTable.day} >= ${firstDay}`)
        .orderBy(asc(sitePageViewsTable.day)),
      db.select({
        totalPageViews: sql<number>`coalesce(sum(${sitePageViewsTable.pageViews}), 0)`,
      }).from(sitePageViewsTable),
      db.select({
        totalAppInstallClicks: sql<number>`coalesce(sum(${sitePageViewsTable.appInstallClicks}), 0)`,
      }).from(sitePageViewsTable),
      recentDailyRegistrations(firstDay, today),
    ]);

    const adminEmails = new Set((process.env.MANDARIN_ADMIN_EMAILS ?? "").split(",")
      .map((email) => email.trim().toLowerCase()).filter(Boolean));
    const members = users.data.map((user) => projectAdminMember(
      user,
      hasVerifiedAdministratorEmail(user.emailAddresses, adminEmails),
    ));

    const dashboard = GetAdminDashboardResponse.parse({
      memberCount: users.totalCount,
      members,
      nextOffset: offset + members.length < users.totalCount ? offset + members.length : null,
      totalPageViews: Number(totals[0]?.totalPageViews ?? 0),
      totalAppInstallClicks: Number(installTotals[0]?.totalAppInstallClicks ?? 0),
      dailyPageViews: fillDailyPageViews(
        viewDays.map((row) => ({ date: row.date, pageViews: row.pageViews })),
        today,
        firstDay,
      ),
      dailyAppInstallClicks: fillDailyAppInstallClicks(
        installDays.map((row) => ({ date: row.date, appInstallClicks: row.appInstallClicks })),
        today,
        firstDay,
      ),
      dailyRegistrations,
    });
    res.json({
      ...dashboard,
      dailyPageViews: dashboard.dailyPageViews.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        pageViews: row.pageViews,
      })),
      dailyAppInstallClicks: dashboard.dailyAppInstallClicks.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        appInstallClicks: row.appInstallClicks,
      })),
      dailyRegistrations: dashboard.dailyRegistrations.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        registrations: row.registrations,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Could not load administrator dashboard");
    res.status(503).json({ error: "Dashboard data is temporarily unavailable. Please retry." });
  }
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Administrator dashboard request failed");
  res.status(503).json({ error: "Dashboard data is temporarily unavailable. Please retry." });
};
router.use("/admin", errorHandler);

export default router;
