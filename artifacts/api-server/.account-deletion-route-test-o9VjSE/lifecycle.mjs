
    import { createHash } from "node:crypto";
    import { db, accountDeletionsTable } from "@workspace/db";
    import { eq } from "drizzle-orm";
    export const accountHash = (userId) => createHash("sha256").update(userId).digest("hex");
    export async function deletionState(userId) {
      return (await db.select().from(accountDeletionsTable)
        .where(eq(accountDeletionsTable.accountHash, accountHash(userId))).limit(1))[0];
    }
    export async function lockAccount(tx) { await tx.execute(); }
  