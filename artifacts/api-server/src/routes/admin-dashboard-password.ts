import { Router, type ErrorRequestHandler, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db, adminDashboardCredentialsTable } from "@workspace/db";
import {
  CreateAdminDashboardPasswordSessionBody,
  SetupAdminDashboardPasswordBody,
  UpdateAdminDashboardPasswordBody,
  GetAdminDashboardPasswordStatusResponse,
  SetupAdminDashboardPasswordResponse,
  CreateAdminDashboardPasswordSessionResponse,
  UpdateAdminDashboardPasswordResponse,
} from "@workspace/api-zod";
import { isAdministrator } from "../admin";
import {
  clearAdminDashboardPasswordCookie,
  createAdminDashboardPasswordSession,
  deleteAdminDashboardPasswordSession,
  getAdminDashboardCredential,
  getAdminDashboardPasswordStatus,
  registerFailedAdminDashboardPasswordAttempt,
  requireAdminDashboardPasswordSession,
  revokeAdminDashboardPasswordSessions,
} from "../admin-dashboard-password";
import { hashAdminDashboardPassword, verifyAdminDashboardPassword } from "../admin-dashboard-password-crypto";

const router: IRouter = Router();
const ALLOWED_PASSWORD = /^[\s\S]{12,128}$/;

function siteOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  const allowed = [
    "https://mandaringarden.asia",
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
  });
  return allowed.includes(origin);
}

function rejectCrossOrigin(req: Request, res: Response): boolean {
  if (siteOriginAllowed(req.get("origin"))) return false;
  res.status(403).json({ error: "Use the administrator page on this website." });
  return true;
}

async function authorizeAdmin(req: Request, res: Response): Promise<string | null> {
  res.setHeader("Cache-Control", "private, no-store");
  const userId = getAuth(req).userId;
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return null;
  }
  if (!await isAdministrator(userId)) {
    res.status(403).json({ error: "Administrator access required." });
    return null;
  }
  return userId;
}

router.get("/admin/dashboard/password/status", async (req, res): Promise<void> => {
  try {
    const userId = await authorizeAdmin(req, res);
    if (!userId) return;
    const status = await getAdminDashboardPasswordStatus(userId, req);
    res.json(GetAdminDashboardPasswordStatusResponse.parse(status));
  } catch (error) {
    req.log.error({ err: error }, "Could not read administrator password status");
    res.status(503).json({ error: "Password service is temporarily unavailable." });
  }
});

router.post("/admin/dashboard/password", async (req, res): Promise<void> => {
  try {
    const userId = await authorizeAdmin(req, res);
    if (!userId || rejectCrossOrigin(req, res)) return;
    const parsed = SetupAdminDashboardPasswordBody.safeParse(req.body);
    if (!parsed.success || !ALLOWED_PASSWORD.test(parsed.data.password) ||
      parsed.data.password !== parsed.data.confirmation) {
      res.status(400).json({ error: "Use at least 12 characters and enter the same password twice." });
      return;
    }
    const existing = await getAdminDashboardCredential();
    if (existing) {
      res.status(409).json({ error: "A dashboard password is already configured." });
      return;
    }
    const hash = await hashAdminDashboardPassword(parsed.data.password);
    const [credential] = await db.insert(adminDashboardCredentialsTable).values({
      id: 1,
      ...hash,
      passwordVersion: 1,
      failedAttempts: 0,
      lockedUntil: null,
    }).onConflictDoNothing().returning();
    if (!credential) {
      res.status(409).json({ error: "A dashboard password is already configured." });
      return;
    }
    await createAdminDashboardPasswordSession(userId, credential, res);
    res.json(SetupAdminDashboardPasswordResponse.parse({
      passwordConfigured: true,
      passwordAuthenticated: true,
    }));
  } catch (error) {
    req.log.error({ err: error }, "Could not set administrator dashboard password");
    res.status(503).json({ error: "Password service is temporarily unavailable." });
  }
});

router.post("/admin/dashboard/password/session", async (req, res): Promise<void> => {
  try {
    const userId = await authorizeAdmin(req, res);
    if (!userId || rejectCrossOrigin(req, res)) return;
    const parsed = CreateAdminDashboardPasswordSessionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Enter the administrator dashboard password." });
      return;
    }
    const credential = await getAdminDashboardCredential();
    if (!credential) {
      res.status(423).json({ error: "Set the administrator dashboard password first." });
      return;
    }
    if (credential.lockedUntil && credential.lockedUntil.getTime() > Date.now()) {
      res.setHeader("Retry-After", String(Math.ceil((credential.lockedUntil.getTime() - Date.now()) / 1000)));
      res.status(429).json({ error: "Too many attempts. Wait before trying again." });
      return;
    }
    const passwordMatches = await verifyAdminDashboardPassword(
      parsed.data.password,
      credential.passwordSalt,
      credential.passwordHash,
    );
    if (!passwordMatches) {
      await registerFailedAdminDashboardPasswordAttempt(credential);
      res.status(401).json({ error: "The dashboard password is incorrect." });
      return;
    }
    const [updatedCredential] = await db.update(adminDashboardCredentialsTable).set({
      failedAttempts: 0,
      lockedUntil: null,
    }).where(and(
      eq(adminDashboardCredentialsTable.id, 1),
      eq(adminDashboardCredentialsTable.passwordVersion, credential.passwordVersion),
    )).returning();
    if (!updatedCredential) {
      res.status(401).json({ error: "The dashboard password changed. Please try again." });
      return;
    }
    await createAdminDashboardPasswordSession(userId, updatedCredential, res);
    res.json(CreateAdminDashboardPasswordSessionResponse.parse({
      passwordConfigured: true,
      passwordAuthenticated: true,
    }));
  } catch (error) {
    req.log.error({ err: error }, "Could not unlock administrator dashboard");
    res.status(503).json({ error: "Password service is temporarily unavailable." });
  }
});

router.patch("/admin/dashboard/password", async (req, res): Promise<void> => {
  try {
    const userId = await authorizeAdmin(req, res);
    if (!userId || rejectCrossOrigin(req, res)) return;
    if (!await requireAdminDashboardPasswordSession(userId, req, res)) return;
    const parsed = UpdateAdminDashboardPasswordBody.safeParse(req.body);
    if (!parsed.success || !ALLOWED_PASSWORD.test(parsed.data.password) ||
      parsed.data.password !== parsed.data.confirmation) {
      res.status(400).json({ error: "Use at least 12 characters and enter the same password twice." });
      return;
    }
    const credential = await getAdminDashboardCredential();
    if (!credential || !await verifyAdminDashboardPassword(
      parsed.data.currentPassword,
      credential.passwordSalt,
      credential.passwordHash,
    )) {
      res.status(401).json({ error: "The current dashboard password is incorrect." });
      return;
    }
    const hash = await hashAdminDashboardPassword(parsed.data.password);
    const [updated] = await db.update(adminDashboardCredentialsTable).set({
      ...hash,
      passwordVersion: credential.passwordVersion + 1,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    }).where(and(
      eq(adminDashboardCredentialsTable.id, 1),
      eq(adminDashboardCredentialsTable.passwordVersion, credential.passwordVersion),
    )).returning();
    if (!updated) {
      res.status(409).json({ error: "The dashboard password changed. Please refresh and try again." });
      return;
    }
    await revokeAdminDashboardPasswordSessions();
    await createAdminDashboardPasswordSession(userId, updated, res);
    res.json(UpdateAdminDashboardPasswordResponse.parse({
      passwordConfigured: true,
      passwordAuthenticated: true,
    }));
  } catch (error) {
    req.log.error({ err: error }, "Could not change administrator dashboard password");
    res.status(503).json({ error: "Password service is temporarily unavailable." });
  }
});

router.delete("/admin/dashboard/password/session", async (req, res): Promise<void> => {
  try {
    const userId = await authorizeAdmin(req, res);
    if (!userId) return;
    if (rejectCrossOrigin(req, res)) return;
    await deleteAdminDashboardPasswordSession(req, userId);
    clearAdminDashboardPasswordCookie(res);
    res.sendStatus(204);
  } catch (error) {
    req.log.error({ err: error }, "Could not lock administrator dashboard");
    res.status(503).json({ error: "Password service is temporarily unavailable." });
  }
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Administrator password request failed");
  res.status(503).json({ error: "Password service is temporarily unavailable." });
};
router.use("/admin/dashboard/password", errorHandler);

export default router;
