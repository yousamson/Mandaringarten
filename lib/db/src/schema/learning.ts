import { boolean, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const learningProgressTable = pgTable("learning_progress", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  selectedStage: integer("selected_stage").notNull().default(1),
  xpByStage: jsonb("xp_by_stage").$type<number[]>().notNull().default([0, 0, 0, 0]),
  legacyImported: boolean("legacy_imported").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learningRoundsTable = pgTable("learning_rounds", {
  clerkUserId: text("clerk_user_id").notNull(),
  roundId: text("round_id").notNull(),
  stage: integer("stage").notNull(),
  mode: text("mode").notNull(),
  correctCount: integer("correct_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.clerkUserId, table.roundId] })]);

export const legalConsentsTable = pgTable("legal_consents", {
  clerkUserId: text("clerk_user_id").notNull(),
  policyVersion: text("policy_version").notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.clerkUserId, table.policyVersion] })]);

export const checkoutConsentsTable = pgTable("checkout_consents", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  policyVersion: text("policy_version").notNull(),
  privacyAccepted: boolean("privacy_accepted").notNull(),
  disclaimerAccepted: boolean("disclaimer_accepted").notNull(),
  noRefundAccepted: boolean("no_refund_accepted").notNull(),
  stripeSessionId: text("stripe_session_id"),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
});
