import { Router, type IRouter, type ErrorRequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { and, eq } from "drizzle-orm";
import { db, learningProgressTable, learningRoundsTable, legalConsentsTable } from "@workspace/db";
import { AcceptLegalConsentBody, RecordLearningRoundBody, UpdateLearningProgressBody, GetLearningProgressResponse } from "@workspace/api-zod";
import { hasCurrentConsent, POLICY_VERSION } from "../legal";
import { hasPremiumMembership } from "./billing";

const router: IRouter = Router();
router.use(["/learning", "/legal"], (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
});

async function ensureProgress(userId: string) {
  await db.insert(learningProgressTable).values({ clerkUserId: userId }).onConflictDoNothing();
}

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
  await db.insert(legalConsentsTable).values({
    clerkUserId: getAuth(req).userId!, policyVersion: POLICY_VERSION,
  }).onConflictDoNothing();
  res.json({ accepted: true, policyVersion: POLICY_VERSION });
});

router.get("/learning/progress", async (req, res) => {
  const userId = getAuth(req).userId!;
  await ensureProgress(userId);
  const [progress] = await db.select().from(learningProgressTable).where(eq(learningProgressTable.clerkUserId, userId));
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
  await ensureProgress(userId);
  const saved = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(learningProgressTable)
      .where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    let xpByStage = [...current.xpByStage];
    const migrate = parsed.data.legacyXpTotal !== undefined && !current.legacyImported;
    if (migrate) {
      xpByStage = xpByStage.map((xp, index) =>
        Math.max(xp, Math.min(100, Math.max(0, parsed.data.legacyXpTotal! - index * 100))));
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
  await ensureProgress(userId);
  const saved = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(learningProgressTable)
      .where(eq(learningProgressTable.clerkUserId, userId)).for("update");
    const [existing] = await tx.select().from(learningRoundsTable).where(and(
      eq(learningRoundsTable.clerkUserId, userId), eq(learningRoundsTable.roundId, parsed.data.roundId),
    )).limit(1);
    if (existing) return current;
    if (current.selectedStage !== parsed.data.stage) return null;
    await tx.insert(learningRoundsTable).values({ clerkUserId: userId, ...parsed.data });
    const xpByStage = [...current.xpByStage];
    xpByStage[parsed.data.stage - 1] += parsed.data.correctCount * 5;
    const [updated] = await tx.update(learningProgressTable).set({ xpByStage, updatedAt: new Date() })
      .where(eq(learningProgressTable.clerkUserId, userId)).returning();
    return updated;
  });
  if (!saved) { res.status(409).json({ error: "Selected stage changed. Reload the learning playground before playing." }); return; }
  res.json(output(saved));
});

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Account learning or consent operation failed");
  res.status(503).json({ error: "Account data is temporarily unavailable. Your saved progress has not been reset." });
};
router.use(errorHandler);
export default router;
