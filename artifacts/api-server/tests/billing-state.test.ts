import test from "node:test";
import assert from "node:assert/strict";
import { cancellationAtPeriodEnd } from "../src/subscription-state";

test("reports both legacy and timestamp-based period-end cancellations", () => {
  assert.equal(cancellationAtPeriodEnd({ cancel_at_period_end: true }, 1000), true);
  assert.equal(cancellationAtPeriodEnd({ cancel_at_period_end: false, cancel_at: 1000 }, 1000), true);
  assert.equal(cancellationAtPeriodEnd({ cancel_at_period_end: false, cancel_at: null }, 1000), false);
  assert.equal(cancellationAtPeriodEnd({ cancel_at: 900 }, 1000), false);
  assert.equal(cancellationAtPeriodEnd(undefined, null), false);
});
