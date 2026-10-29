import { createHash } from "node:crypto";

/** Retry concurrent attempts safely, but never replay a completed/expired checkout. */
export function checkoutIdempotencyKey(customerId: string, latestSessionId: string | undefined, form: URLSearchParams, now = Date.now()): string {
  const fingerprint = JSON.stringify([customerId, latestSessionId ?? "initial", form.toString(), Math.floor(now / 1_800_000)]);
  return `mg-checkout-v2-${createHash("sha256").update(fingerprint).digest("hex")}`;
}

/** Newer Stripe portal flows may set cancel_at instead of the legacy flag. */
export function cancellationAtPeriodEnd(
  subscription: { cancel_at_period_end?: boolean; cancel_at?: number | null } | undefined,
  periodEnd: number | null,
): boolean {
  return subscription?.cancel_at_period_end === true ||
    (periodEnd !== null && subscription?.cancel_at === periodEnd);
}
