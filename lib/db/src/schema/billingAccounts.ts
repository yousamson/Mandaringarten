import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const billingAccountsTable = pgTable("billing_accounts", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertBillingAccountSchema = createInsertSchema(
  billingAccountsTable,
).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertBillingAccount = z.infer<typeof insertBillingAccountSchema>;
export type BillingAccount = typeof billingAccountsTable.$inferSelect;
