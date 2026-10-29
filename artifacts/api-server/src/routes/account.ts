import { Router, type IRouter, type ErrorRequestHandler } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { eq, inArray, desc } from "drizzle-orm";
import {
  db, accountDeletionsTable, billingAccountsTable, billingCustomersTable, billingCustomerScopesTable,
  learningProgressTable, learningRoundsTable, legalConsentsTable, checkoutConsentsTable,
  supportThreadsTable, supportMessagesTable,
} from "@workspace/db";
import { DeleteAccountBody } from "@workspace/api-zod";
import { accountHash, deletionState, lockAccount } from "../account-lifecycle";
import { isAdministrator } from "../admin";
import { hasPremiumMembership } from "./billing";
import { stripeRequest } from "../stripeClient";
import { currentCustomerIds } from "../stripe-customers";

const router: IRouter = Router();
router.use("/account", (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  if (!getAuth(req).userId) { res.status(401).json({ error: "Authentication required." }); return; }
  next();
});
router.get("/account/access", async (req, res) => {
  const userId = getAuth(req).userId!;
  if (await deletionState(userId)) {
    res.json({ isAdmin: false, isPremium: false, access: "deleting" }); return;
  }
  const [isAdmin, isPremium] = await Promise.all([isAdministrator(userId), hasPremiumMembership(userId)]);
  res.json({ isAdmin, isPremium, access: isAdmin || isPremium ? "active" : "subscription_required" });
});

type StripeObject = { id: string; status?: string; deleted?: boolean };
async function cancelAndRemoveCustomer(customerId: string) {
  const customer = await stripeRequest<StripeObject>(`/v1/customers/${encodeURIComponent(customerId)}`);
  if (customer.deleted) return;
  // Fetch every page. Never leave an older open checkout or subscription behind.
  for (const resource of ["checkout/sessions", "subscriptions"] as const) {
    let after: string | undefined;
    do {
      const query = new URLSearchParams({ customer: customerId, limit: "100" });
      if (resource === "subscriptions") query.set("status", "all");
      if (after) query.set("starting_after", after);
      const page = await stripeRequest<{ data: StripeObject[]; has_more: boolean }>(`/v1/${resource}?${query}`);
      for (const item of page.data) {
        if (resource === "checkout/sessions" && item.status === "open") {
          await stripeRequest(`/v1/checkout/sessions/${item.id}/expire`, { method: "POST", form: new URLSearchParams() });
        }
        if (resource === "subscriptions" && item.status !== "canceled" && item.status !== "incomplete_expired") {
          await stripeRequest(`/v1/subscriptions/${item.id}`, {
            method: "DELETE", form: new URLSearchParams({ prorate: "false", invoice_now: "false" }),
          });
        }
      }
      after = page.has_more ? page.data.at(-1)?.id : undefined;
    } while (after);
  }
  // Stripe retains legally required financial records; no Refund API is called.
  await stripeRequest(`/v1/customers/${encodeURIComponent(customerId)}`, { method: "DELETE" });
}

router.delete("/account", async (req, res) => {
  const parsed = DeleteAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "All policy and deletion acknowledgments and the exact confirmation DELETE are required." }); return;
  }
  const userId = getAuth(req).userId!;
  const hash = accountHash(userId);
  if ((await deletionState(userId))?.completed) { res.json({ deleted: true }); return; }
  await db.transaction(async (tx) => {
    await lockAccount(tx, userId);
    await tx.insert(accountDeletionsTable).values({ accountHash: hash }).onConflictDoNothing();
  });
  const mappings = await db.select().from(billingCustomersTable).where(eq(billingCustomersTable.clerkUserId, userId));
  const olderMappings = await db.select().from(billingAccountsTable).where(eq(billingAccountsTable.clerkUserId, userId));
  for (const id of await currentCustomerIds(userId, [...mappings, ...olderMappings].map((m) => m.stripeCustomerId))) {
    await cancelAndRemoveCustomer(id);
  }
  // Remove local data first; a failed identity deletion leaves the retry route
  // usable, but the tombstone continues to block every normal account action.
  await db.transaction(async (tx) => {
    await lockAccount(tx, userId);
    const threads = await tx.select({ id: supportThreadsTable.id }).from(supportThreadsTable)
      .where(eq(supportThreadsTable.clerkUserId, userId));
    const authoredThreads = await tx.selectDistinct({ id: supportMessagesTable.threadId }).from(supportMessagesTable)
      .where(eq(supportMessagesTable.authorId, userId));
    if (threads.length) await tx.delete(supportMessagesTable).where(inArray(supportMessagesTable.threadId, threads.map((t) => t.id)));
    await tx.delete(supportMessagesTable).where(eq(supportMessagesTable.authorId, userId));
    await tx.delete(supportThreadsTable).where(eq(supportThreadsTable.clerkUserId, userId));
    for (const thread of authoredThreads) {
      const [last] = await tx.select({ text: supportMessagesTable.text }).from(supportMessagesTable)
        .where(eq(supportMessagesTable.threadId, thread.id)).orderBy(desc(supportMessagesTable.createdAt), desc(supportMessagesTable.id)).limit(1);
      await tx.update(supportThreadsTable).set({ lastMessagePreview: last?.text.slice(0, 160) ?? "" })
        .where(eq(supportThreadsTable.id, thread.id));
    }
    await tx.delete(learningRoundsTable).where(eq(learningRoundsTable.clerkUserId, userId));
    await tx.delete(learningProgressTable).where(eq(learningProgressTable.clerkUserId, userId));
    await tx.delete(legalConsentsTable).where(eq(legalConsentsTable.clerkUserId, userId));
    await tx.delete(checkoutConsentsTable).where(eq(checkoutConsentsTable.clerkUserId, userId));
    await tx.delete(billingCustomersTable).where(eq(billingCustomersTable.clerkUserId, userId));
    await tx.delete(billingCustomerScopesTable).where(eq(billingCustomerScopesTable.clerkUserId, userId));
    await tx.delete(billingAccountsTable).where(eq(billingAccountsTable.clerkUserId, userId));
  });
  try { await clerkClient.users.deleteUser(userId); }
  catch (error) {
    if (!(typeof error === "object" && error !== null && "status" in error && error.status === 404)) throw error;
  }
  await db.update(accountDeletionsTable).set({ completed: new Date() }).where(eq(accountDeletionsTable.accountHash, hash));
  res.json({ deleted: true });
});
const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Account access or deletion operation failed");
  res.status(503).json({ error: "The account operation could not be completed. Please retry; deletion is not confirmed until successful." });
};
router.use(errorHandler);
export default router;
