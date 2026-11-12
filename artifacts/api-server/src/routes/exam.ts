import { Router, type ErrorRequestHandler, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db, examLevelProgressTable } from "@workspace/db";
import { GetExamProgressResponse, RecordExamActivityBody } from "@workspace/api-zod";
import { withAccountWrite } from "../account-lifecycle";
import { hasCurrentConsent } from "../legal";
import { isAdministrator } from "../admin";
import { getPremiumMembershipTier } from "./billing";
import {
  buildExamProgress,
  canAccessExamLevel,
  examProgressVersionMarker,
  isExamLevel,
  isExamTrack,
  type ExamMembershipTier,
  type ExamProgressRecord,
} from "../exam-progress";

const router: IRouter = Router();

router.use("/learning/exam", (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
});

async function membershipTier(userId: string): Promise<ExamMembershipTier> {
  if (await isAdministrator(userId)) return "admin";
  return getPremiumMembershipTier(userId);
}

async function progressRecords(userId: string): Promise<ExamProgressRecord[]> {
  const rows = await db.select({
    trackId: examLevelProgressTable.trackId,
    levelId: examLevelProgressTable.levelId,
    completedActivities: examLevelProgressTable.completedActivities,
  }).from(examLevelProgressTable).where(eq(examLevelProgressTable.clerkUserId, userId));
  return rows;
}

router.get("/learning/exam/progress", async (req, res): Promise<void> => {
  const userId = getAuth(req).userId!;
  try {
    const [tier, records] = await Promise.all([membershipTier(userId), progressRecords(userId)]);
    res.json(GetExamProgressResponse.parse(buildExamProgress(tier, records)));
  } catch (error) {
    req.log.error({ err: error }, "Could not load Chinese Treasure House progress");
    res.status(503).json({ error: "Chinese Treasure House progress is temporarily unavailable." });
  }
});

router.post("/learning/exam/activity", async (req, res): Promise<void> => {
  const parsed = RecordExamActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a valid Chinese Treasure House level and activity." });
    return;
  }
  const { trackId, levelId, activity } = parsed.data;
  if (!isExamTrack(trackId) || !isExamLevel(trackId, levelId)) {
    res.status(400).json({ error: "Choose a valid Chinese Treasure House level and activity." });
    return;
  }

  const userId = getAuth(req).userId!;
  if (!await hasCurrentConsent(userId)) {
    res.status(403).json({ error: "Current privacy policy and disclaimer consent is required.", code: "CONSENT_REQUIRED" });
    return;
  }

  try {
    const tier = await membershipTier(userId);
    if (tier === "none") {
      res.status(403).json({ error: "An active trial or subscription is required.", code: "MEMBERSHIP_REQUIRED" });
      return;
    }

    const saved = await withAccountWrite(userId, async (tx) => {
      const currentRows = await tx.select({
        trackId: examLevelProgressTable.trackId,
        levelId: examLevelProgressTable.levelId,
        completedActivities: examLevelProgressTable.completedActivities,
      }).from(examLevelProgressTable).where(eq(examLevelProgressTable.clerkUserId, userId));
      const current = currentRows as ExamProgressRecord[];
      if (!canAccessExamLevel(tier, current, trackId, levelId)) return null;

      await tx.insert(examLevelProgressTable).values({
        clerkUserId: userId,
        trackId,
        levelId,
      }).onConflictDoNothing();
      const [stored] = await tx.select().from(examLevelProgressTable).where(and(
        eq(examLevelProgressTable.clerkUserId, userId),
        eq(examLevelProgressTable.trackId, trackId),
        eq(examLevelProgressTable.levelId, levelId),
      )).for("update");
      const completedActivities = [...new Set([
        ...stored.completedActivities,
        examProgressVersionMarker,
        activity,
      ])];
      await tx.update(examLevelProgressTable).set({
        completedActivities,
        updatedAt: new Date(),
      }).where(and(
        eq(examLevelProgressTable.clerkUserId, userId),
        eq(examLevelProgressTable.trackId, trackId),
        eq(examLevelProgressTable.levelId, levelId),
      ));
      const rows = await tx.select({
        trackId: examLevelProgressTable.trackId,
        levelId: examLevelProgressTable.levelId,
        completedActivities: examLevelProgressTable.completedActivities,
      }).from(examLevelProgressTable).where(eq(examLevelProgressTable.clerkUserId, userId));
      return rows as ExamProgressRecord[];
    });

    if (!saved) {
      res.status(403).json({ error: "Complete the previous level before recording this activity.", code: "LEVEL_LOCKED" });
      return;
    }
    res.json(GetExamProgressResponse.parse(buildExamProgress(tier, saved)));
  } catch (error) {
    req.log.error({ err: error }, "Could not save Chinese Treasure House activity progress");
    res.status(503).json({ error: "Chinese Treasure House progress could not be saved. Please retry." });
  }
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Chinese Treasure House progress operation failed");
  res.status(503).json({ error: "Chinese Treasure House progress is temporarily unavailable." });
};
router.use(errorHandler);

export default router;
