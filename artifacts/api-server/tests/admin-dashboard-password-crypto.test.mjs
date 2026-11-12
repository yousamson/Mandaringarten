import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createAdminDashboardSessionToken,
  hashAdminDashboardPassword,
  hashAdminDashboardSessionToken,
  verifyAdminDashboardPassword,
} from "../src/admin-dashboard-password-crypto.ts";

test("dashboard passwords are salted and verified without storing plaintext", async () => {
  const password = "a-long-admin-password";
  const first = await hashAdminDashboardPassword(password);
  const second = await hashAdminDashboardPassword(password);

  assert.notEqual(first.passwordSalt, second.passwordSalt);
  assert.notEqual(first.passwordHash, password);
  assert.notEqual(first.passwordHash, second.passwordHash);
  assert.equal(await verifyAdminDashboardPassword(password, first.passwordSalt, first.passwordHash), true);
  assert.equal(await verifyAdminDashboardPassword("a-different-password", first.passwordSalt, first.passwordHash), false);
  assert.equal(await verifyAdminDashboardPassword(password, "invalid", first.passwordHash), false);
});

test("dashboard session tokens are random, opaque, and stored only by hash", () => {
  const token = createAdminDashboardSessionToken();
  assert.match(token, /^[a-f0-9]{64}$/);
  assert.notEqual(hashAdminDashboardSessionToken(token), token);
  assert.notEqual(hashAdminDashboardSessionToken(token), hashAdminDashboardSessionToken(createAdminDashboardSessionToken()));
});
