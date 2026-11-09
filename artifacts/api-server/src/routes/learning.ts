import { Router, type IRouter, type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { getAuth } from "@clerk/express";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, learningChallengesTable, learningProgressTable, learningRoundsTable, legalConsentsTable } from "@workspace/db";
import { AcceptLegalConsentBody, IssueLearningRoundBody, IssueLearningRoundResponse, RecordLearningRoundBody, RecordLearningRoundResponse, RecordGardenCareBody, UpdateLearningProgressBody, GetLearningProgressResponse } from "@workspace/api-zod";
import { buildRound, type GameMode, type Script } from "@workspace/learning-content/games";
import {
  advanceGardenCare,
  getGardenStatus,
  GARDEN_CARE_XP_COST,
  XP_PER_CORRECT,
  XP_PER_INCORRECT,
  type GardenCareType,
  type GardenProgress,
} from "@workspace/learning-content";
import { hasCurrentConsent, POLICY_VERSION } from "../legal";
import { hasPremiumMembership } from "./billing";
import { withAccountWrite } from "../account-lifecycle";
import { isAdministrator } from "../admin";
import { calculateXpBalances, deriveLegacyBaseline, mergeLegacyProgress } from "../learning-progress";

const router: IRouter = Router();
export const LEARNING_CHALLENGE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export async function cleanupExpiredLearningChallenges(now = new Date()) {
  const cutoff = new Date(now.getTime() - LEARNING_CHALLENGE_RETENTION_MS);
  await db.delete(learningChallengesTable).where(lt(learningChallengesTable.createdAt, cutoff));
}

router.use(["/learning", "/legal"], (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
});

function gardenProgress(row: typeof learningProgressTable.$inferSelect): GardenProgress {
  return {
    growthDays: row.gardenGrowthDays,
    streakDays: row.gardenStreakDays,
    lastCareDate: row.gardenLastCareDate,
    lastCareType: row.gardenLastCareType === "water" || row.gardenLastCareType === "fertilize"
      ? row.gardenLastCareType
      : null,
  };
}

function output(row: typeof learningProgressTable.$inferSelect, now = new Date()) {
  const selectedStageXp = row.xpByStage[row.selectedStage - 1] ?? 0;
  return GetLearningProgressResponse.parse({
    selectedStage: row.selectedStage,
    xpByStage: row.xpByStage,
    garden: getGardenStatus(gardenProgress(row), now.toISOString().slice(0, 10), selectedStageXp),
  });
}

async function xpDeltaByStage(tx: Parameters<typeof withAccountWrite>[1] extends (tx: infer T) => Promise<unknown> ? T : never, userId: string) {
  const rows = await tx.select({
    stage: learningRoundsTable.stage,
    xp: sql<number>`coalesce(sum(${learningRoundsTable.xpDelta}), 0)`.mapWith(Number),
  }).from(learningRoundsTable)
    .where(eq(learningRoundsTable.clerkUserId, userId))
    .groupBy(learningRoundsTable.stage);
  const totals = [0, 0, 0, 0];
  for (const row of rows) totals[row.stage - 1] = row.xp;
  return totals;
}

async function ensureXpLedger(
  tx: Parameters<typeof withAccountWrite>[1] extends (tx: infer T) => Promise<unknown> ? T : never,
  row: typeof learningProgressTable.$inferSelect,
) {
  if (row.xpLedgerVersion >= 1) return row;
  const history = await xpDeltaByStage(tx, row.clerkUserId);
  const [migrated] = await tx.update(learningProgressTable).set({
    legacyXpByStage: deriveLegacyBaseline(row.xpByStage, history),
    xpLedgerVersion: 1,
    updatedAt: new Date(),
  }).where(eq(learningProgressTable.clerkUserId, row.clerkUserId)).returning();
  return migrated;
}

async function reconcileXp(
  tx: Parameters<typeof withAccountWrite>[1] extends (tx: infer T) => Promise<unknown> ? T : never,
  row: typeof learningProgressTable.$inferSelect,
) {
  const history = await xpDeltaByStage(tx, row.clerkUserId);
  const xpByStage = calculateXpBalances(row.legacyXpByStage, history, row.xpSpentByStage);
  if (xpByStage.every((xp, index) => xp === row.xpByStage[index])) return row;
  const [updated] = await tx.update(learningProgressTable).set({ xpByStage, updatedAt: new Date() })
    .where(eq(learningProgressTable.clerkUserId, row.clerkUserId)).returning();
  return updated;
}

router.get("/legal/consent", async (req, res) => {
  const accepted = await hasCurrentConsent(getAuth(req).userId!);
  res.json({ accepted, policyVersion: POLICY_VERSION });
});

router.post("/legal/consent", async (req, res) => {
  const parsed = AcceptLegalConsentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Read and acknowledge both documents and confirm adult supervision." });
    return;
  }
  const userId = getAuth(req).userId!;
  await withAccountWrite(userId, async (tx) => {
    await tx.insert(legalConsentsTable).values({ clerkUserId: userId, policyVersion: POLICY_VERSION }).onConflictDoNothing();
  });
  res.json({ accepted: true, policyVersion: POLICY_VERSION });
});

router.get("/learning/progress", async (req, res) => {
  const userId = getAuth(req).userId!;
  if (!await hasPremiumMembership(userId) && !await isAdministrator(userId)) {
    res.status(403).json({ error: "Renew your subscription to access member data.", code: "SUBSCRIPTION_REQUIRED" }); return;
  }
  const progress = await withAccountWrite(userId, async (tx) => {
    await tx.insert(learningProgressTable).values({ clerkUserId: userId }).onConflictDoNothing();
    const [row] = await tx.select().from(learningProgressTable).where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    return reconcileXp(tx, await ensureXpLedger(tx, row));
  });
  res.json(output(progress));
});

router.use("/learning", async (req, res, next) => {
  if (req.method === "GET") { next(); return; }
  const userId = getAuth(req).userId!;
  if (!await hasCurrentConsent(userId)) {
    res.status(403).json({ error: "Current privacy policy and disclaimer consent is required." });
    return;
  }
  if (!await hasPremiumMembership(userId) && !await isAdministrator(userId)) {
    res.status(403).json({ error: "Active membership is required to choose a stage and save game rounds." });
    return;
  }
  next();
});

router.put("/learning/progress", async (req, res) => {
  const parsed = UpdateLearningProgressBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid learning stage or legacy progress." }); return; }
  const userId = getAuth(req).userId!;
  const saved = await withAccountWrite(userId, async (tx) => {
    await tx.insert(learningProgressTable).values({ clerkUserId: userId }).onConflictDoNothing();
    const [stored] = await tx.select().from(learningProgressTable)
      .where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    const current = await reconcileXp(tx, await ensureXpLedger(tx, stored));
    let legacyXpByStage = [...current.legacyXpByStage];
    const migrate = parsed.data.legacyXpTotal !== undefined;
    if (migrate) {
      legacyXpByStage = mergeLegacyProgress(legacyXpByStage, parsed.data.legacyXpTotal!, [0, 0, 0, 0]);
    }
    const answerXpByStage = await xpDeltaByStage(tx, userId);
    const xpByStage = calculateXpBalances(legacyXpByStage, answerXpByStage, current.xpSpentByStage);
    const [updated] = await tx.update(learningProgressTable).set({
      // Importing older browser XP must not overwrite a newer parent selection.
      selectedStage: parsed.data.legacyXpTotal !== undefined ? current.selectedStage : parsed.data.selectedStage,
      xpByStage,
      legacyXpByStage,
      xpLedgerVersion: 1,
      legacyImported: current.legacyImported || migrate,
      updatedAt: new Date(),
    }).where(eq(learningProgressTable.clerkUserId, userId)).returning();
    return updated;
  });
  res.json(output(saved));
});

router.post("/learning/rounds", async (req, res): Promise<void> => {
  const parsed = IssueLearningRoundBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid game round." }); return; }
  await cleanupExpiredLearningChallenges();
  const userId = getAuth(req).userId!;
  const roundId = randomUUID();
  const questions = buildRound(parsed.data.stage, parsed.data.mode as GameMode, parsed.data.script as Script)
    .map((question) => ({ ...question, id: randomUUID() }));
  const answers = Object.fromEntries(questions.map(({ id, answer }) => [id, answer]));
  await withAccountWrite(userId, async (tx) => {
    await tx.insert(learningChallengesTable).values({
      clerkUserId: userId,
      roundId,
      stage: parsed.data.stage,
      mode: parsed.data.mode,
      answers,
    });
  });
  res.status(201).json(IssueLearningRoundResponse.parse({
    roundId,
    stage: parsed.data.stage,
    mode: parsed.data.mode,
    questions: questions.map(({ answer: _answer, ...question }) => question),
  }));
});

router.post("/learning/round", async (req, res) => {
  const parsed = RecordLearningRoundBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid answer submission." }); return; }
  const userId = getAuth(req).userId!;
  const saved = await withAccountWrite(userId, async (tx) => {
    await tx.insert(learningProgressTable).values({ clerkUserId: userId }).onConflictDoNothing();
    const [stored] = await tx.select().from(learningProgressTable)
      .where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    const current = await reconcileXp(tx, await ensureXpLedger(tx, stored));
    const [challenge] = await tx.select().from(learningChallengesTable).where(and(
      eq(learningChallengesTable.clerkUserId, userId),
      eq(learningChallengesTable.roundId, parsed.data.roundId),
    )).limit(1);
    if (!challenge) return null;
    if (challenge.createdAt.getTime() < Date.now() - LEARNING_CHALLENGE_RETENTION_MS) {
      return { expired: true as const };
    }
    if (!Object.hasOwn(challenge.answers, parsed.data.questionId)) return null;
    const correct = challenge.answers[parsed.data.questionId] === parsed.data.answer;
    const [existing] = await tx.select().from(learningRoundsTable).where(and(
      eq(learningRoundsTable.clerkUserId, userId), eq(learningRoundsTable.roundId, parsed.data.questionId),
    )).limit(1);
    if (existing) {
      return existing.challengeId === parsed.data.roundId &&
        existing.submittedAnswer === parsed.data.answer &&
        existing.stage === challenge.stage && existing.mode === challenge.mode &&
        existing.correctCount === (correct ? 1 : 0)
        ? { progress: current, correct, xpDelta: existing.xpDelta }
        : null;
    }
    const stageIndex = challenge.stage - 1;
    const xpByStage = [...current.xpByStage];
    const xpDelta = correct
      ? XP_PER_CORRECT
      : -Math.min(XP_PER_INCORRECT, xpByStage[stageIndex] ?? 0);
    xpByStage[stageIndex] = Math.max(0, (xpByStage[stageIndex] ?? 0) + xpDelta);
    await tx.insert(learningRoundsTable).values({
      clerkUserId: userId,
      roundId: parsed.data.questionId,
      challengeId: challenge.roundId,
      submittedAnswer: parsed.data.answer,
      stage: challenge.stage,
      mode: challenge.mode,
      correctCount: correct ? 1 : 0,
      xpDelta,
    });
    const [updated] = await tx.update(learningProgressTable).set({ xpByStage, updatedAt: new Date() })
      .where(eq(learningProgressTable.clerkUserId, userId)).returning();
    return { progress: updated, correct, xpDelta };
  });
  if (!saved) {
    res.status(404).json({
      error: "This round or question was not issued to this account, or the round has expired. No XP was awarded.",
      code: "ROUND_UNAVAILABLE",
    });
    return;
  }
  if ("expired" in saved) {
    res.status(410).json({
      error: "This game round has expired. Start a new round; no XP was awarded.",
      code: "ROUND_EXPIRED",
    });
    return;
  }
  res.json(RecordLearningRoundResponse.parse({ ...output(saved.progress), correct: saved.correct, xpDelta: saved.xpDelta }));
});

router.post("/learning/garden/care", async (req, res) => {
  const parsed = RecordGardenCareBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Choose watering or fertilizer." }); return; }
  const userId = getAuth(req).userId!;
  const saved = await withAccountWrite(userId, async (tx) => {
    await tx.insert(learningProgressTable).values({ clerkUserId: userId }).onConflictDoNothing();
    const [stored] = await tx.select().from(learningProgressTable)
      .where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    const current = await reconcileXp(tx, await ensureXpLedger(tx, stored));
    const selectedXp = current.xpByStage[current.selectedStage - 1] ?? 0;
    const today = new Date().toISOString().slice(0, 10);
    const status = getGardenStatus(gardenProgress(current), today, selectedXp);
    if (status.caredToday) return { error: "already-cared" as const };
    if (selectedXp < GARDEN_CARE_XP_COST) return { error: "insufficient-xp" as const };

    const type = parsed.data.type as GardenCareType;
    const nextGarden = advanceGardenCare(gardenProgress(current), type, today);
    const xpByStage = [...current.xpByStage];
    const xpSpentByStage = [...current.xpSpentByStage];
    const stageIndex = current.selectedStage - 1;
    xpByStage[stageIndex] -= GARDEN_CARE_XP_COST;
    xpSpentByStage[stageIndex] += GARDEN_CARE_XP_COST;
    const [updated] = await tx.update(learningProgressTable).set({
      xpByStage,
      xpSpentByStage,
      gardenGrowthDays: nextGarden.growthDays,
      gardenStreakDays: nextGarden.streakDays,
      gardenLastCareDate: nextGarden.lastCareDate,
      gardenLastCareType: nextGarden.lastCareType,
      updatedAt: new Date(),
    }).where(eq(learningProgressTable.clerkUserId, userId)).returning();
    return { progress: updated };
  });
  if ("error" in saved) {
    const message = saved.error === "already-cared"
      ? "The garden has already been cared for today."
      : "Earn 20 XP in the selected stage before caring for the garden.";
    res.status(409).json({ error: message, code: saved.error === "already-cared" ? "GARDEN_CARED_TODAY" : "GARDEN_XP_REQUIRED" });
    return;
  }
  res.json(output(saved.progress));
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Account learning or consent operation failed");
  res.status(503).json({ error: "Account data is temporarily unavailable. Your saved progress has not been reset." });
};
router.use(errorHandler);
export default router;
