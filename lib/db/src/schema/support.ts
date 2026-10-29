import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";

export const supportThreadsTable = pgTable("support_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull(),
  subject: text("subject").notNull(),
  lastMessagePreview: text("last_message_preview").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("support_thread_owner_idx").on(t.clerkUserId)]);

export const supportMessagesTable = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull().references(() => supportThreadsTable.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull(),
  author: text("author").$type<"parent" | "team">().notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("support_message_thread_idx").on(t.threadId)]);

// Minimal security tombstone blocks still-valid JWTs and supports safe deletion retries.
// It contains a one-way account identifier, not email, messages or learning records.
export const accountDeletionsTable = pgTable("account_deletions", {
  accountHash: text("account_hash").primaryKey(),
  completed: timestamp("completed", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
