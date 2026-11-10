type AnalyticsPayload = Record<string, string | number | boolean>;

type AnalyticsWindow = Window & {
  umami?: {
    track: (event: string, payload?: AnalyticsPayload) => void;
  };
};

/** Replit injects the analytics client only when publishing analytics is enabled. */
export function trackAnalyticsEvent(event: string, payload?: AnalyticsPayload): void {
  try {
    (window as AnalyticsWindow).umami?.track(event, payload);
  } catch {
    // Analytics must never interrupt sign-up, checkout, or learning flows.
  }
}
