import { Router, type IRouter, type ErrorRequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { eq } from "drizzle-orm";
import { db, billingCustomersTable } from "@workspace/db";
import {
  CreateBillingCheckoutBody,
  CreateBillingCheckoutResponse,
  CreateBillingPortalBody,
  CreateBillingPortalResponse,
  GetBillingStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const connectors = new ReplitConnectors();
const monthlyPriceId = "price_1UVqkEAjIuxj9DGyoDwdJYVV";

type StripeCustomer = { id: string };
type StripeSubscription = {
  status: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  items?: { data?: Array<{ price?: { id?: string }; current_period_end?: number }> };
};

async function stripeRequest<T>(
  path: string,
  form?: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  const response = await connectors.proxy("stripe", path, {
    method: form ? "POST" : "GET",
    headers: form ? {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    } : undefined,
    body: form?.toString(),
  });
  const result = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(result.error?.message ?? `Stripe request failed (${response.status})`);
  }
  return result;
}

function currentUserId(req: Parameters<typeof getAuth>[0]): string | null {
  return getAuth(req).userId ?? null;
}

function safeReturnUrl(raw: string, origin: string | undefined): string | null {
  try {
    if (!origin) return null;
    const url = new URL(raw);
    const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !(url.protocol === "http:" && localHost)) return null;
    if (url.origin !== origin) return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function customerSubscriptions(customerId: string): Promise<StripeSubscription[]> {
  const query = new URLSearchParams({ customer: customerId, status: "all", limit: "100" });
  const result = await stripeRequest<{ data: StripeSubscription[] }>(`/v1/subscriptions?${query}`);
  return result.data.filter((item) =>
    item.items?.data?.some((line) => line.price?.id === monthlyPriceId),
  );
}

async function getCustomer(userId: string): Promise<string> {
  const [existing] = await db
    .select()
    .from(billingCustomersTable)
    .where(eq(billingCustomersTable.clerkUserId, userId))
    .limit(1);
  if (existing) return existing.stripeCustomerId;

  const customer = await stripeRequest<StripeCustomer>(
    "/v1/customers",
    new URLSearchParams({ "metadata[clerkUserId]": userId }),
    `mandarin-customer:${userId}`,
  );
  await db
    .insert(billingCustomersTable)
    .values({ clerkUserId: userId, stripeCustomerId: customer.id })
    .onConflictDoNothing({ target: billingCustomersTable.clerkUserId });
  const [saved] = await db
    .select()
    .from(billingCustomersTable)
    .where(eq(billingCustomersTable.clerkUserId, userId))
    .limit(1);
  return saved?.stripeCustomerId ?? customer.id;
}

router.get("/billing/status", async (req, res): Promise<void> => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [customer] = await db
    .select()
    .from(billingCustomersTable)
    .where(eq(billingCustomersTable.clerkUserId, userId))
    .limit(1);
  if (!customer) {
    res.json(GetBillingStatusResponse.parse({
      isPremium: false,
      subscriptionStatus: "none",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    }));
    return;
  }

  const subscriptions = await customerSubscriptions(customer.stripeCustomerId);
  const subscription = subscriptions.find((item) =>
    item.status === "active" || item.status === "trialing",
  ) ?? subscriptions[0];
  const isPremium = subscription?.status === "active" || subscription?.status === "trialing";
  const periodEnd = subscription?.current_period_end ??
    subscription?.items?.data?.[0]?.current_period_end;
  res.json(GetBillingStatusResponse.parse({
    isPremium,
    subscriptionStatus: subscription?.status ?? "none",
    currentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
  }));
});

router.post("/billing/checkout", async (req, res): Promise<void> => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateBillingCheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const origin = req.get("origin") ?? undefined;
  const successUrl = safeReturnUrl(parsed.data.successUrl, origin);
  const cancelUrl = safeReturnUrl(parsed.data.cancelUrl, origin);
  if (!successUrl || !cancelUrl) {
    res.status(400).json({ error: "Return URLs must use the current website origin." });
    return;
  }

  const customerId = await getCustomer(userId);
  const existingSubscriptions = await customerSubscriptions(customerId);
  if (existingSubscriptions.some((item) =>
    ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(item.status),
  )) {
    res.status(409).json({ error: "An existing subscription must be managed in the billing portal." });
    return;
  }
  const sessions = await stripeRequest<{
    data: Array<{ mode: string; status: string; url: string | null }>;
  }>(`/v1/checkout/sessions?${new URLSearchParams({ customer: customerId, limit: "20" })}`);
  const openSession = sessions.data.find((item) => item.mode === "subscription" && item.status === "open" && item.url);
  if (openSession?.url) {
    res.json(CreateBillingCheckoutResponse.parse({ url: openSession.url }));
    return;
  }
  const session = await stripeRequest<{ url: string | null }>(
    "/v1/checkout/sessions",
    new URLSearchParams({
      mode: "subscription",
      customer: customerId,
      "line_items[0][price]": monthlyPriceId,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      "metadata[clerkUserId]": userId,
      "subscription_data[metadata][clerkUserId]": userId,
    }),
    `mandarin-premium:${customerId}:${Math.floor(Date.now() / 1_800_000)}`,
  );
  if (!session.url) {
    res.status(502).json({ error: "Stripe did not return a checkout URL." });
    return;
  }
  res.json(CreateBillingCheckoutResponse.parse({ url: session.url }));
});

router.post("/billing/portal", async (req, res): Promise<void> => {
  const userId = currentUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateBillingPortalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const returnUrl = safeReturnUrl(parsed.data.returnUrl, req.get("origin") ?? undefined);
  if (!returnUrl) {
    res.status(400).json({ error: "Return URL must use the current website origin." });
    return;
  }
  const [customer] = await db
    .select()
    .from(billingCustomersTable)
    .where(eq(billingCustomersTable.clerkUserId, userId))
    .limit(1);
  if (!customer) {
    res.status(404).json({ error: "No Stripe customer found for this account." });
    return;
  }
  const session = await stripeRequest<{ url: string }>(
    "/v1/billing_portal/sessions",
    new URLSearchParams({
      customer: customer.stripeCustomerId,
      return_url: returnUrl,
    }),
  );
  res.json(CreateBillingPortalResponse.parse({ url: session.url }));
});

const billingErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Billing request failed");
  res.status(502).json({ error: "The billing service is temporarily unavailable. Please try again." });
};
router.use(billingErrorHandler);

export default router;
