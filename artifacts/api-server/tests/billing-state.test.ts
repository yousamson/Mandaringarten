import test from "node:test";
import assert from "node:assert/strict";
import { cancellationAtPeriodEnd, checkoutIdempotencyKey } from "../src/subscription-state";

test("reports both legacy and timestamp-based period-end cancellations", () => {
  assert.equal(cancellationAtPeriodEnd({ cancel_at_period_end: true }, 1000), true);
  assert.equal(cancellationAtPeriodEnd({ cancel_at_period_end: false, cancel_at: 1000 }, 1000), true);
  assert.equal(cancellationAtPeriodEnd({ cancel_at_period_end: false, cancel_at: null }, 1000), false);
  assert.equal(cancellationAtPeriodEnd({ cancel_at: 900 }, 1000), false);
  assert.equal(cancellationAtPeriodEnd(undefined, null), false);
});

test("checkout retries deduplicate but renewal never replays a completed session", () => {
  const form = new URLSearchParams({ mode: "subscription", currency: "usd" });
  const first = checkoutIdempotencyKey("customer", undefined, form, 1000);
  assert.equal(first, checkoutIdempotencyKey("customer", undefined, form, 1100));
  const renewal = checkoutIdempotencyKey("customer", "completed-first", form, 1100);
  assert.notEqual(first, renewal);
  assert.equal(renewal, checkoutIdempotencyKey("customer", "completed-first", form, 1200));
  assert.notEqual(renewal, checkoutIdempotencyKey("customer", "expired-renewal", form, 1200));
  assert.notEqual(renewal, checkoutIdempotencyKey("other-customer", "completed-first", form, 1200));
});
