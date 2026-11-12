import { index, integer, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

/** One site-wide administrator password; only a salted hash is stored. */
export const adminDashboardCredentialsTable = pgTable("admin_dashboard_credentials", {
  id: smallint("id").primaryKey(),
  passwordSalt: text("password_salt").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordVersion: integer("password_version").notNull().default(1),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Opaque, revocable password sessions tied to the verified Clerk administrator. */
export const adminDashboardSessionsTable = pgTable("admin_dashboard_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  passwordVersion: integer("password_version").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("admin_dashboard_sessions_user_idx").on(table.clerkUserId)]);
