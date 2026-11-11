import { boolean, date, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const learningProgressTable = pgTable("learning_progress", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  selectedStage: integer("selected_stage").notNull().default(1),
  xpByStage: jsonb("xp_by_stage").$type<number[]>().notNull().default([0, 0, 0, 0]),
  legacyXpByStage: jsonb("legacy_xp_by_stage").$type<number[]>().notNull().default([0, 0, 0, 0]),
  xpSpentByStage: jsonb("xp_spent_by_stage").$type<number[]>().notNull().default([0, 0, 0, 0]),
  xpLedgerVersion: integer("xp_ledger_version").notNull().default(0),
  gardenGrowthDays: integer("garden_growth_days").notNull().default(0),
  gardenStreakDays: integer("garden_streak_days").notNull().default(0),
  gardenLastCareDate: date("garden_last_care_date", { mode: "string" }),
  gardenLastCareType: text("garden_last_care_type"),
  legacyImported: boolean("legacy_imported").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learningRoundsTable = pgTable("learning_rounds", {
  clerkUserId: text("clerk_user_id").notNull(),
  roundId: text("round_id").notNull(),
  challengeId: text("challenge_id"),
  submittedAnswer: text("submitted_answer"),
  stage: integer("stage").notNull(),
  mode: text("mode").notNull(),
  correctCount: integer("correct_count").notNull(),
  xpDelta: integer("xp_delta").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.clerkUserId, table.roundId] })]);

export const learningChallengesTable = pgTable("learning_challenges", {
  clerkUserId: text("clerk_user_id").notNull(),
  roundId: text("round_id").notNull(),
  stage: integer("stage").notNull(),
  mode: text("mode").notNull(),
  answers: jsonb("answers").$type<Record<string, string>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.clerkUserId, table.roundId] }),
  index("learning_challenges_created_at_idx").on(table.createdAt),
]);

export const examLevelProgressTable = pgTable("exam_level_progress", {
  clerkUserId: text("clerk_user_id").notNull(),
  trackId: text("track_id").notNull(),
  levelId: text("level_id").notNull(),
  completedActivities: jsonb("completed_activities").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.clerkUserId, table.trackId, table.levelId] })]);

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
