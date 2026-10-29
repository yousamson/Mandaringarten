import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

/** Keep sandbox/account reconnects from overwriting an existing live mapping. */
export const billingCustomerScopesTable = pgTable("billing_customer_scopes", {
  clerkUserId: text("clerk_user_id").notNull(),
  stripeScope: text("stripe_scope").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.clerkUserId, table.stripeScope] }),
]);
