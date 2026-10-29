import { ReplitConnectors } from "@replit/connectors-sdk";
import { StripeRequestError } from "./stripe-customer-state";
import { createReadDeduplicator } from "./in-flight-requests";

const connectors = new ReplitConnectors();
const deduplicateRead = createReadDeduplicator();

export type StripePrice = {
  id: string;
  active: boolean;
  currency: string;
  unit_amount: number | null;
  livemode: boolean;
  recurring?: { interval: string } | null;
};

export type StripeSubscription = {
  id: string;
  status: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  cancel_at?: number | null;
  items?: {
    data?: Array<{
      price?: { id?: string };
      current_period_end?: number;
    }>;
  };
};

type StripeResponse = {
  error?: { message?: string; code?: string };
};

export async function stripeRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "DELETE";
    form?: URLSearchParams;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  const operation = () => performStripeRequest<T>(path, options);
  return (options.method ?? "GET") === "GET"
    ? deduplicateRead(path, operation)
    : operation();
}

async function performStripeRequest<T>(
  path: string,
  options: { method?: "GET" | "POST" | "DELETE"; form?: URLSearchParams; idempotencyKey?: string },
  retried = false,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  const response = await connectors.proxy("stripe", path, {
    method: options.method ?? "GET",
    headers,
    body: options.form?.toString(),
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & StripeResponse)
    | null;

  if (response.status === 429 && !retried && (options.method ?? "GET") === "GET") {
    const seconds = Number(response.headers.get("retry-after") ?? "1");
    const delay = Number.isFinite(seconds) ? Math.min(5, Math.max(1, seconds)) : 1;
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));
    return performStripeRequest<T>(path, options, true);
  }

  if (!response.ok || payload === null) {
    const message = payload?.error?.message;
    throw new StripeRequestError(
      typeof message === "string"
        ? `Stripe request failed: ${message}`
        : `Stripe request failed (${response.status}).`,
      response.status,
      payload?.error?.code,
    );
  }

  return payload as T;
}
