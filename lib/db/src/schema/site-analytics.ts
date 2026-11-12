import { date, integer, pgTable } from "drizzle-orm/pg-core";

/**
 * Privacy-preserving aggregate counts only. No visitor IDs, account IDs, IPs,
 * or page URLs are stored in this table.
 */
export const sitePageViewsTable = pgTable("site_page_views", {
  day: date("day", { mode: "string" }).primaryKey(),
  pageViews: integer("page_views").notNull().default(0),
  appInstallClicks: integer("app_install_clicks").notNull().default(0),
});
