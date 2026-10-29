import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool, accountDeletionsTable, learningProgressTable, legalConsentsTable } from "@workspace/db";
import { accountHash, lockAccount, withAccountWrite } from "../src/account-lifecycle";

after(async () => { await pool.end(); });

test("a deletion tombstone blocks subsequent account writes without recreating data", async () => {
  const userId = `lifecycle-test-${randomUUID()}`;
  const hash = accountHash(userId);
  try {
    await withAccountWrite(userId, async (tx) => {
      await tx.insert(learningProgressTable).values({ clerkUserId: userId, selectedStage: 4, xpByStage: [0, 0, 0, 25] });
    });
    await db.transaction(async (tx) => {
      await lockAccount(tx, userId);
      await tx.insert(accountDeletionsTable).values({ accountHash: hash });
      await tx.delete(learningProgressTable).where(eq(learningProgressTable.clerkUserId, userId));
    });
    await assert.rejects(withAccountWrite(userId, async (tx) => {
      await tx.insert(legalConsentsTable).values({ clerkUserId: userId, policyVersion: "test" });
    }), /deletion is in progress/);
    assert.equal((await db.select().from(learningProgressTable).where(eq(learningProgressTable.clerkUserId, userId))).length, 0);
    assert.equal((await db.select().from(legalConsentsTable).where(eq(legalConsentsTable.clerkUserId, userId))).length, 0);
  } finally {
    await db.delete(legalConsentsTable).where(eq(legalConsentsTable.clerkUserId, userId));
    await db.delete(learningProgressTable).where(eq(learningProgressTable.clerkUserId, userId));
    await db.delete(accountDeletionsTable).where(eq(accountDeletionsTable.accountHash, hash));
  }
});
