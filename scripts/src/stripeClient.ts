import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

type StripeErrorResponse = {
  error?: { message?: string };
};

export async function stripeRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST";
    form?: URLSearchParams;
    idempotencyKey?: string;
  } = {},
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
    | (T & StripeErrorResponse)
    | null;

  if (!response.ok || payload === null) {
    const message = payload?.error?.message;
    throw new Error(
      typeof message === "string"
        ? `Stripe request failed: ${message}`
        : `Stripe request failed (${response.status}).`,
    );
  }

  return payload as T;
}
