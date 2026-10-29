/** Newer Stripe portal flows may set cancel_at instead of the legacy flag. */
export function cancellationAtPeriodEnd(
  subscription: { cancel_at_period_end?: boolean; cancel_at?: number | null } | undefined,
  periodEnd: number | null,
): boolean {
  return subscription?.cancel_at_period_end === true ||
    (periodEnd !== null && subscription?.cancel_at === periodEnd);
}
