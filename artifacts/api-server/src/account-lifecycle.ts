import { createHash } from "node:crypto";
import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { eq, sql } from "drizzle-orm";
import { db, accountDeletionsTable } from "@workspace/db";

export const accountHash = (userId: string) => createHash("sha256").update(userId).digest("hex");
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function deletionState(userId: string) {
  const [state] = await db.select().from(accountDeletionsTable)
    .where(eq(accountDeletionsTable.accountHash, accountHash(userId))).limit(1);
  return state;
}

export async function lockAccount(tx: Transaction, userId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
}

/** Serializes account writes with deletion, across all server instances. */
export async function withAccountWrite<T>(userId: string, operation: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await lockAccount(tx, userId);
    const [deleted] = await tx.select().from(accountDeletionsTable)
      .where(eq(accountDeletionsTable.accountHash, accountHash(userId))).limit(1);
    if (deleted) throw new Error("Account deletion is in progress.");
    return operation(tx);
  });
}

export const accountLifecycleGuard: RequestHandler = async (req, res, next) => {
  try {
    const userId = getAuth(req).userId;
    if (!userId || (req.path === "/analytics/page-view" && req.method === "POST") ||
      (req.path === "/account" && req.method === "DELETE") ||
      (req.path === "/account/access" && req.method === "GET")) {
      next(); return;
    }
    if (await deletionState(userId)) {
      res.status(403).json({ error: "Account deletion is in progress.", code: "ACCOUNT_DELETING" });
      return;
    }
    next();
  } catch (error) { next(error); }
};
