import { Router, type IRouter, type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { getAuth } from "@clerk/express";
import { and, eq, sql } from "drizzle-orm";
import { db, learningChallengesTable, learningProgressTable, learningRoundsTable, legalConsentsTable } from "@workspace/db";
import { AcceptLegalConsentBody, IssueLearningRoundBody, IssueLearningRoundResponse, RecordLearningRoundBody, RecordLearningRoundResponse, UpdateLearningProgressBody, GetLearningProgressResponse } from "@workspace/api-zod";
import { buildRound, type GameMode, type Script } from "@workspace/learning-content/games";
import { hasCurrentConsent, POLICY_VERSION } from "../legal";
import { hasPremiumMembership } from "./billing";
import { withAccountWrite } from "../account-lifecycle";
import { isAdministrator } from "../admin";
import { mergeLegacyProgress } from "../learning-progress";

const router: IRouter = Router();
router.use(["/learning", "/legal"], (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
});

function output(row: typeof learningProgressTable.$inferSelect) {
  return GetLearningProgressResponse.parse({ selectedStage: row.selectedStage, xpByStage: row.xpByStage });
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
    const [row] = await tx.select().from(learningProgressTable).where(eq(learningProgressTable.clerkUserId, userId));
    return row;
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
  if (!await hasPremiumMembership(userId)) {
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
    const [current] = await tx.select().from(learningProgressTable)
      .where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    let xpByStage = [...current.xpByStage];
    const migrate = parsed.data.legacyXpTotal !== undefined;
    if (migrate) {
      const rounds = await tx.select({
        stage: learningRoundsTable.stage,
        xp: sql<number>`coalesce(sum(${learningRoundsTable.correctCount}) * 5, 0)`.mapWith(Number),
      }).from(learningRoundsTable).where(eq(learningRoundsTable.clerkUserId, userId))
        .groupBy(learningRoundsTable.stage);
      const earned = [0, 0, 0, 0];
      for (const round of rounds) earned[round.stage - 1] = round.xp;
      xpByStage = mergeLegacyProgress(xpByStage, parsed.data.legacyXpTotal!, earned);
    }
    const [updated] = await tx.update(learningProgressTable).set({
      // Importing older browser XP must not overwrite a newer parent selection.
      selectedStage: parsed.data.legacyXpTotal !== undefined ? current.selectedStage : parsed.data.selectedStage,
      xpByStage,
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
    const [current] = await tx.select().from(learningProgressTable)
      .where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    const [challenge] = await tx.select().from(learningChallengesTable).where(and(
      eq(learningChallengesTable.clerkUserId, userId),
      eq(learningChallengesTable.roundId, parsed.data.roundId),
    )).limit(1);
    if (!challenge || !Object.hasOwn(challenge.answers, parsed.data.questionId)) return null;
    if (challenge.answers[parsed.data.questionId] !== parsed.data.answer) {
      return { progress: current, correct: false };
    }
    const [existing] = await tx.select().from(learningRoundsTable).where(and(
      eq(learningRoundsTable.clerkUserId, userId), eq(learningRoundsTable.roundId, parsed.data.questionId),
    )).limit(1);
    if (existing) {
      return existing.challengeId === parsed.data.roundId &&
        existing.submittedAnswer === parsed.data.answer &&
        existing.stage === challenge.stage && existing.mode === challenge.mode &&
        existing.correctCount === 1
        ? { progress: current, correct: true }
        : null;
    }
    // Award only a server-checked correct answer to the stage recorded at issue time.
    await tx.insert(learningRoundsTable).values({
      clerkUserId: userId,
      roundId: parsed.data.questionId,
      challengeId: challenge.roundId,
      submittedAnswer: parsed.data.answer,
      stage: challenge.stage,
      mode: challenge.mode,
      correctCount: 1,
    });
    const xpByStage = [...current.xpByStage];
    xpByStage[challenge.stage - 1] += 5;
    const [updated] = await tx.update(learningProgressTable).set({ xpByStage, updatedAt: new Date() })
      .where(eq(learningProgressTable.clerkUserId, userId)).returning();
    return { progress: updated, correct: true };
  });
  if (!saved) {
    res.status(404).json({ error: "This round or question was not issued to this account." });
    return;
  }
  res.json(RecordLearningRoundResponse.parse({ ...output(saved.progress), correct: saved.correct }));
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Account learning or consent operation failed");
  res.status(503).json({ error: "Account data is temporarily unavailable. Your saved progress has not been reset." });
};
router.use(errorHandler);
export default router;
