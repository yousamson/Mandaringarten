import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fillDailyAppInstallClicks,
  fillDailyPageViews,
  fillDailyRegistrations,
  hongKongDate,
  projectAdminMember,
  shiftCalendarDate,
} from "../src/admin-dashboard-data.ts";

test("daily analytics buckets follow the Hong Kong calendar day", () => {
  assert.equal(hongKongDate(new Date("2026-11-11T17:00:00.000Z")), "2026-11-12");
  assert.equal(hongKongDate(new Date("2026-11-12T15:59:59.000Z")), "2026-11-12");
});

test("daily page views fill gaps without inventing pre-launch history", () => {
  assert.equal(shiftCalendarDate("2026-11-01", 1), "2026-11-02");
  assert.deepEqual(fillDailyPageViews([
    { date: "2026-11-10", pageViews: 3 },
    { date: "2026-11-12", pageViews: 5 },
  ], "2026-11-12", "2026-10-14"), [
    { date: "2026-11-10", pageViews: 3 },
    { date: "2026-11-11", pageViews: 0 },
    { date: "2026-11-12", pageViews: 5 },
  ]);
  assert.deepEqual(fillDailyPageViews([], "2026-11-12", "2026-10-14"), []);
});

test("daily app install clicks fill gaps without inventing pre-launch history", () => {
  assert.deepEqual(fillDailyAppInstallClicks([
    { date: "2026-11-10", appInstallClicks: 2 },
    { date: "2026-11-12", appInstallClicks: 1 },
  ], "2026-11-12", "2026-10-14"), [
    { date: "2026-11-10", appInstallClicks: 2 },
    { date: "2026-11-11", appInstallClicks: 0 },
    { date: "2026-11-12", appInstallClicks: 1 },
  ]);
});

test("daily registrations include zero-count days in the requested range", () => {
  assert.deepEqual(fillDailyRegistrations([
    { date: "2026-11-10", registrations: 3 },
  ], "2026-11-12", "2026-11-10"), [
    { date: "2026-11-10", registrations: 3 },
    { date: "2026-11-11", registrations: 0 },
    { date: "2026-11-12", registrations: 0 },
  ]);
});

test("administrator member projection returns only the required registration details", () => {
  const result = projectAdminMember({
    id: "user_1",
    emailAddresses: [
      { id: "secondary", emailAddress: "secondary@example.test" },
      { id: "primary", emailAddress: "parent@example.test", verification: { status: "verified" } },
    ],
    primaryEmailAddressId: "primary",
    firstName: "Lee",
    lastName: "Family",
    createdAt: 1_795_000_000_000,
    privateMetadata: { secret: "not copied" },
  });
  assert.deepEqual(result, {
    id: "user_1",
    email: "parent@example.test",
    name: "Lee Family",
    createdAt: new Date(1_795_000_000_000).toISOString(),
  });
  assert.deepEqual(Object.keys(result).sort(), ["createdAt", "email", "id", "name"]);
});

test("administrator account email is never included in the dashboard projection", () => {
  const result = projectAdminMember({
    id: "user_admin",
    emailAddresses: [{
      id: "primary",
      emailAddress: "team@example.test",
      verification: { status: "verified" },
    }],
    primaryEmailAddressId: "primary",
    firstName: null,
    lastName: null,
    createdAt: 1_795_000_000_000,
  }, true);
  assert.equal(result.email, null);
  assert.equal(result.name, "Mandarin Garden team");
  assert.equal(JSON.stringify(result).includes("team@example.test"), false);
});
