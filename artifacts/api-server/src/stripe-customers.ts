import { and, eq } from "drizzle-orm";
import { billingCustomerScopesTable, billingCustomersTable, db } from "@workspace/db";
import { withAccountWrite } from "./account-lifecycle";
import { customerExistsInMode } from "./stripe-customer-state";
import { stripeRequest } from "./stripeClient";
import { createReadCache } from "./in-flight-requests";

const cacheStripeScope = createReadCache<string>(5 * 60 * 1000);
const cacheCustomerExists = createReadCache<boolean>(30 * 1000, Boolean);

async function currentScope() {
  return cacheStripeScope("current-stripe-scope", async () => {
    const account = await stripeRequest<{ id: string }>("/v1/account");
    return `${account.id}:${process.env.NODE_ENV === "production" ? "live" : "test"}`;
  });
}

const exists = (id: string, scope: string) => cacheCustomerExists(`${scope}:${id}`, () =>
  customerExistsInMode(
    () => stripeRequest(`/v1/customers/${encodeURIComponent(id)}`),
    process.env.NODE_ENV === "production",
  ));

async function findCustomer(userId: string, scope: string) {
  const [scoped] = await db.select().from(billingCustomerScopesTable).where(and(
    eq(billingCustomerScopesTable.clerkUserId, userId),
    eq(billingCustomerScopesTable.stripeScope, scope),
  )).limit(1);
  if (scoped && await exists(scoped.stripeCustomerId, scope)) return scoped;
  const [legacy] = await db.select().from(billingCustomersTable)
    .where(eq(billingCustomersTable.clerkUserId, userId)).limit(1);
  if (legacy && await exists(legacy.stripeCustomerId, scope)) return legacy;
  return null;
}

export async function getCustomer(userId: string) {
  return findCustomer(userId, await currentScope());
}

export async function getOrCreateCustomer(userId: string) {
  const scope = await currentScope();
  return withAccountWrite(userId, async (tx) => {
    const existing = await findCustomer(userId, scope);
    if (existing) return existing;
    const customer = await stripeRequest<{ id: string; livemode: boolean }>("/v1/customers", {
      method: "POST",
      form: new URLSearchParams({ "metadata[clerkUserId]": userId }),
      idempotencyKey: `mandarin-garden-customer-${scope}-${userId}`,
    });
    if (customer.livemode !== (process.env.NODE_ENV === "production")) {
      throw new Error("Stripe customer mode does not match the application environment.");
    }
    const [saved] = await tx.insert(billingCustomerScopesTable).values({
      clerkUserId: userId, stripeScope: scope, stripeCustomerId: customer.id,
    }).onConflictDoUpdate({
      target: [billingCustomerScopesTable.clerkUserId, billingCustomerScopesTable.stripeScope],
      set: { stripeCustomerId: customer.id },
    }).returning();
    return saved;
  });
}

/** Deletion operates only on customers that actually belong to the current connector. */
export async function currentCustomerIds(userId: string, legacyIds: string[]) {
  const scope = await currentScope();
  const scoped = await db.select().from(billingCustomerScopesTable).where(and(
    eq(billingCustomerScopesTable.clerkUserId, userId),
    eq(billingCustomerScopesTable.stripeScope, scope),
  ));
  const ids = [...new Set([...legacyIds, ...scoped.map((row) => row.stripeCustomerId)])];
  const checks = await Promise.all(ids.map(async (id) => ({ id, valid: await exists(id, scope) })));
  return checks.filter((item) => item.valid).map((item) => item.id);
}
