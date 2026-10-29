import { Router, type IRouter, type ErrorRequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { and, eq, desc, asc, gte, count } from "drizzle-orm";
import { db, supportThreadsTable, supportMessagesTable } from "@workspace/db";
import { CreateSupportThreadBody, SendSupportMessageBody } from "@workspace/api-zod";
import { isAdministrator } from "../admin";
import { withAccountWrite } from "../account-lifecycle";

const router: IRouter = Router();
router.use("/support", (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (!getAuth(req).userId) { res.status(401).json({ error: "Authentication required." }); return; }
  next();
});

function threadOutput(t: typeof supportThreadsTable.$inferSelect) {
  return { id: t.id, subject: t.subject, createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(), lastMessagePreview: t.lastMessagePreview };
}
async function conversation(thread: typeof supportThreadsTable.$inferSelect) {
  const messages = await db.select().from(supportMessagesTable)
    .where(eq(supportMessagesTable.threadId, thread.id)).orderBy(asc(supportMessagesTable.createdAt), asc(supportMessagesTable.id));
  return { thread: threadOutput(thread), messages: messages.map((m) => ({
    id: m.id, author: m.author, text: m.text, createdAt: m.createdAt.toISOString(),
  })) };
}
async function authorizedThread(id: string, userId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const admin = await isAdministrator(userId);
  const [thread] = await db.select().from(supportThreadsTable).where(admin ?
    eq(supportThreadsTable.id, id) :
    and(eq(supportThreadsTable.id, id), eq(supportThreadsTable.clerkUserId, userId))).limit(1);
  return thread ? { thread, admin } : null;
}

router.get("/support/threads", async (req, res) => {
  const userId = getAuth(req).userId!;
  const admin = await isAdministrator(userId);
  const threads = await db.select().from(supportThreadsTable)
    .where(admin ? undefined : eq(supportThreadsTable.clerkUserId, userId))
    .orderBy(desc(supportThreadsTable.updatedAt)).limit(200);
  res.json(threads.map(threadOutput));
});

router.post("/support/threads", async (req, res) => {
  const parsed = CreateSupportThreadBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.subject.trim() || !parsed.data.text.trim()) {
    res.status(400).json({ error: "A subject and message are required." }); return;
  }
  const userId = getAuth(req).userId!;
  const thread = await withAccountWrite(userId, async (tx) => {
    const [recent] = await tx.select({ total: count() }).from(supportMessagesTable).where(and(
      eq(supportMessagesTable.authorId, userId), gte(supportMessagesTable.createdAt, new Date(Date.now() - 60_000))));
    if (recent.total >= 10) return null;
    const [created] = await tx.insert(supportThreadsTable).values({
      clerkUserId: userId, subject: parsed.data.subject.trim(), lastMessagePreview: parsed.data.text.trim().slice(0, 160),
    }).returning();
    await tx.insert(supportMessagesTable).values({
      threadId: created.id, authorId: userId, author: "parent", text: parsed.data.text.trim(),
    });
    return created;
  });
  if (!thread) { res.status(429).json({ error: "Please wait a minute before sending more messages." }); return; }
  res.status(201).json(await conversation(thread));
});

router.get("/support/threads/:threadId", async (req, res) => {
  const result = await authorizedThread(String(req.params.threadId), getAuth(req).userId!);
  if (!result) { res.status(404).json({ error: "Conversation not found." }); return; }
  res.json(await conversation(result.thread));
});

router.post("/support/threads/:threadId/messages", async (req, res) => {
  const parsed = SendSupportMessageBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.text.trim()) { res.status(400).json({ error: "A message is required." }); return; }
  const userId = getAuth(req).userId!;
  const result = await authorizedThread(String(req.params.threadId), userId);
  if (!result) { res.status(404).json({ error: "Conversation not found." }); return; }
  const updated = await withAccountWrite(userId, async (tx) => {
    const [recent] = await tx.select({ total: count() }).from(supportMessagesTable).where(and(
      eq(supportMessagesTable.authorId, userId), gte(supportMessagesTable.createdAt, new Date(Date.now() - 60_000))));
    if (recent.total >= 10) return null;
    // The owner may have deleted the conversation since the authorization check.
    const [thread] = await tx.update(supportThreadsTable).set({
      updatedAt: new Date(), lastMessagePreview: parsed.data.text.trim().slice(0, 160),
    }).where(eq(supportThreadsTable.id, result.thread.id)).returning();
    if (!thread) return undefined;
    await tx.insert(supportMessagesTable).values({
      threadId: thread.id, authorId: userId, author: result.admin ? "team" : "parent", text: parsed.data.text.trim(),
    });
    return thread;
  });
  if (updated === null) { res.status(429).json({ error: "Please wait a minute before sending more messages." }); return; }
  if (!updated) { res.status(404).json({ error: "Conversation not found." }); return; }
  res.status(201).json(await conversation(updated));
});
const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Platform message request failed");
  res.status(503).json({ error: "Messages are temporarily unavailable. Please retry." });
};
router.use(errorHandler);
export default router;
