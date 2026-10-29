import { Router, type IRouter, type ErrorRequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { and, eq, sql } from "drizzle-orm";
import { db, learningProgressTable, learningRoundsTable, legalConsentsTable } from "@workspace/db";
import { AcceptLegalConsentBody, RecordLearningRoundBody, UpdateLearningProgressBody, GetLearningProgressResponse } from "@workspace/api-zod";
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

router.post("/learning/round", async (req, res) => {
  const parsed = RecordLearningRoundBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid game round." }); return; }
  const userId = getAuth(req).userId!;
  const saved = await withAccountWrite(userId, async (tx) => {
    await tx.insert(learningProgressTable).values({ clerkUserId: userId }).onConflictDoNothing();
    const [current] = await tx.select().from(learningProgressTable)
      .where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    const [existing] = await tx.select().from(learningRoundsTable).where(and(
      eq(learningRoundsTable.clerkUserId, userId), eq(learningRoundsTable.roundId, parsed.data.roundId),
    )).limit(1);
    if (existing) {
      return existing.stage === parsed.data.stage && existing.mode === parsed.data.mode &&
        existing.correctCount === parsed.data.correctCount ? current : null;
    }
    // Save to the stage actually played, even if another device changed the parent selection.
    await tx.insert(learningRoundsTable).values({ clerkUserId: userId, ...parsed.data });
    const xpByStage = [...current.xpByStage];
    xpByStage[parsed.data.stage - 1] += parsed.data.correctCount * 5;
    const [updated] = await tx.update(learningProgressTable).set({ xpByStage, updatedAt: new Date() })
      .where(eq(learningProgressTable.clerkUserId, userId)).returning();
    return updated;
  });
  if (!saved) { res.status(409).json({ error: "This round identifier was already used for a different result." }); return; }
  res.json(output(saved));
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Account learning or consent operation failed");
  res.status(503).json({ error: "Account data is temporarily unavailable. Your saved progress has not been reset." });
};
router.use(errorHandler);
export default router;
