import { and, eq } from "drizzle-orm";
import { db, legalConsentsTable } from "@workspace/db";

export const POLICY_VERSION = "2026-10-29.1";

export async function hasCurrentConsent(userId: string): Promise<boolean> {
  const [record] = await db.select().from(legalConsentsTable).where(and(
    eq(legalConsentsTable.clerkUserId, userId),
    eq(legalConsentsTable.policyVersion, POLICY_VERSION),
  )).limit(1);
  return Boolean(record);
}
