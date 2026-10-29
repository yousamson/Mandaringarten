import { getAuth } from "@clerk/express";
import {
  CreateBillingCheckoutBody,
  CreateBillingCheckoutResponse,
  CreateBillingPortalBody,
  CreateBillingPortalResponse,
  GetBillingPlanResponse,
  GetBillingStatusResponse,
  GetBillingSubscriptionResponse,
} from "@workspace/api-zod";
import { billingCustomersTable, db } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  Router,
  type ErrorRequestHandler,
  type IRouter,
  type Request,
} from "express";
import {
  stripeRequest,
  type StripePrice,
  type StripeSubscription,
} from "../stripeClient";

const PREMIUM_LOOKUP_KEY = "mandarin_garden_premium_monthly";
const PREMIUM_AMOUNT = 999;
const PREMIUM_CURRENCY = "usd";
const PREMIUM_INTERVAL = "month";

const router: IRouter = Router();

function getAuthenticatedUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

function getAllowedReturnHosts(): Set<string> {
  const values = [
    process.env.REPLIT_DOMAINS,
    process.env.REPLIT_DEV_DOMAIN,
    process.env.REPLIT_EXPO_DEV_DOMAIN,
    process.env.REPLIT_INTERNAL_APP_DOMAIN,
  ];
  const hosts = new Set<string>();

  for (const value of values) {
    for (const item of value?.split(",") ?? []) {
      const normalized = item.trim();
      if (!normalized) continue;
      try {
        hosts.add(
          new URL(
            normalized.includes("://") ? normalized : `https://${normalized}`,
          ).host,
        );
      } catch {
        // Ignore malformed runtime domain entries.
      }
    }
  }

  return hosts;
}

function safeReturnUrl(
  value: string,
  originValue: string | undefined,
): string | null {
  if (!originValue) return null;

  try {
    const returnUrl = new URL(value);
    const origin = new URL(originValue);
    const isLocalHost =
      returnUrl.hostname === "localhost" ||
      returnUrl.hostname === "127.0.0.1";
    const localHttp = returnUrl.protocol === "http:" && isLocalHost;

    if (
      returnUrl.origin !== origin.origin ||
      (returnUrl.protocol !== "https:" && !localHttp) ||
      (!isLocalHost && !getAllowedReturnHosts().has(returnUrl.host))
    ) {
      return null;
    }

    return returnUrl.toString();
  } catch {
    return null;
  }
}

function buildCheckoutReturnUrls(
  value: unknown,
  origin: string | undefined,
): { successUrl: string; cancelUrl: string } | null {
  if (!value || typeof value !== "object") return null;

  const body = value as {
    returnUrl?: string;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (body.returnUrl) {
    const returnUrlString = safeReturnUrl(body.returnUrl, origin);
    if (!returnUrlString) return null;

    const returnUrl = new URL(returnUrlString);
    returnUrl.hash = "";
    returnUrl.searchParams.delete("billing");
    const successUrl = new URL(returnUrl.toString());
    successUrl.searchParams.set("billing", "success");
    const cancelUrl = new URL(returnUrl.toString());
    cancelUrl.searchParams.set("billing", "cancelled");
    return {
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
    };
  }

  if (!body.successUrl || !body.cancelUrl) return null;
  const successUrl = safeReturnUrl(body.successUrl, origin);
  const cancelUrl = safeReturnUrl(body.cancelUrl, origin);
  return successUrl && cancelUrl ? { successUrl, cancelUrl } : null;
}

async function getPremiumPrice(): Promise<StripePrice> {
  const query = new URLSearchParams();
  query.append("lookup_keys[]", PREMIUM_LOOKUP_KEY);
  query.set("active", "true");
  query.set("limit", "10");
  const result = await stripeRequest<{ data: StripePrice[] }>(
    `/v1/prices?${query.toString()}`,
  );
  const price = result.data[0];

  if (
    result.data.length !== 1 ||
    !price ||
    price.unit_amount !== PREMIUM_AMOUNT ||
    price.currency !== PREMIUM_CURRENCY ||
    price.recurring?.interval !== PREMIUM_INTERVAL
  ) {
    throw new Error(
      "The active premium price must be exactly USD 9.99 per month.",
    );
  }

  return price;
}

async function getOrCreateCustomer(userId: string) {
  const [existing] = await db
    .select()
    .from(billingCustomersTable)
    .where(eq(billingCustomersTable.clerkUserId, userId))
    .limit(1);
  if (existing) return existing;

  const form = new URLSearchParams();
  form.set("metadata[clerkUserId]", userId);
  const customer = await stripeRequest<{ id: string }>("/v1/customers", {
    method: "POST",
    form,
    idempotencyKey: `mandarin-garden-customer-${userId}`,
  });
  await db
    .insert(billingCustomersTable)
    .values({ clerkUserId: userId, stripeCustomerId: customer.id })
    .onConflictDoNothing();

  const [saved] = await db
    .select()
    .from(billingCustomersTable)
    .where(eq(billingCustomersTable.clerkUserId, userId))
    .limit(1);
  if (!saved) throw new Error("Could not save the Stripe customer mapping.");
  return saved;
}

async function getCustomer(userId: string) {
  const [customer] = await db
    .select()
    .from(billingCustomersTable)
    .where(eq(billingCustomersTable.clerkUserId, userId))
    .limit(1);
  return customer ?? null;
}

async function listSubscriptions(customerId: string) {
  const [price, subscriptions] = await Promise.all([
    getPremiumPrice(),
    stripeRequest<{ data: StripeSubscription[] }>(
      `/v1/subscriptions?${new URLSearchParams({
        customer: customerId,
        status: "all",
        limit: "100",
      }).toString()}`,
    ),
  ]);

  return subscriptions.data.filter((subscription) =>
    subscription.items?.data?.some((item) => item.price?.id === price.id),
  );
}

function periodEnd(subscription: StripeSubscription | undefined): number | null {
  if (!subscription) return null;
  return (
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end ??
    null
  );
}

router.get("/billing/plan", async (req, res): Promise<void> => {
  try {
    const price = await getPremiumPrice();
    res.json(
      GetBillingPlanResponse.parse({
        unitAmount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        priceLabel: `US$${((price.unit_amount ?? 0) / 100).toFixed(2)}`,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Could not load the premium price");
    res.status(503).json({ error: "The monthly plan is temporarily unavailable." });
  }
});

router.get("/billing/status", async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const customer = await getCustomer(userId);
    if (!customer) {
      res.json(
        GetBillingStatusResponse.parse({
          isPremium: false,
          subscriptionStatus: "none",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        }),
      );
      return;
    }

    const subscriptions = await listSubscriptions(customer.stripeCustomerId);
    const entitled = subscriptions.find(
      (subscription) =>
        subscription.status === "active" || subscription.status === "trialing",
    );
    const latest = entitled ?? subscriptions[0];
    const end = periodEnd(latest);

    res.json(
      GetBillingStatusResponse.parse({
        isPremium: entitled !== undefined,
        subscriptionStatus: latest?.status ?? "none",
        currentPeriodEnd: end ? new Date(end * 1000).toISOString() : null,
        cancelAtPeriodEnd: latest?.cancel_at_period_end ?? false,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Could not load the billing status");
    res.status(503).json({ error: "Subscription status is temporarily unavailable." });
  }
});

router.get("/billing/subscription", async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const customer = await getCustomer(userId);
    if (!customer) {
      res.json(
        GetBillingSubscriptionResponse.parse({
          isPremium: false,
          hasBillingCustomer: false,
          subscriptionStatus: null,
          currentPeriodEnd: null,
        }),
      );
      return;
    }

    const subscriptions = await listSubscriptions(customer.stripeCustomerId);
    const entitled = subscriptions.find(
      (subscription) =>
        subscription.status === "active" || subscription.status === "trialing",
    );
    const latest = entitled ?? subscriptions[0];

    res.json(
      GetBillingSubscriptionResponse.parse({
        isPremium: entitled !== undefined,
        hasBillingCustomer: true,
        subscriptionStatus: latest?.status ?? null,
        currentPeriodEnd: periodEnd(entitled),
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Could not load the subscription status");
    res.status(503).json({ error: "Subscription status is temporarily unavailable." });
  }
});

router.post("/billing/checkout", async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const parsedBody = CreateBillingCheckoutBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "A valid checkout return URL is required." });
    return;
  }

  const returnUrls = buildCheckoutReturnUrls(
    parsedBody.data,
    req.get("origin"),
  );
  if (!returnUrls) {
    res.status(400).json({ error: "The return URL is not allowed." });
    return;
  }

  try {
    const account = await getOrCreateCustomer(userId);
    const subscriptions = await listSubscriptions(account.stripeCustomerId);
    const managedSubscription = subscriptions.find((subscription) =>
      ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(
        subscription.status,
      ),
    );
    if (managedSubscription) {
      res.status(409).json({ error: "Manage the existing subscription in the billing portal." });
      return;
    }

    const openSessions = await stripeRequest<{
      data: Array<{
        client_reference_id?: string | null;
        mode: string;
        status: string;
        url: string | null;
      }>;
    }>(
      `/v1/checkout/sessions?${new URLSearchParams({
        customer: account.stripeCustomerId,
        limit: "20",
      }).toString()}`,
    );
    const openSession = openSessions.data.find(
      (session) =>
        session.client_reference_id === userId &&
        session.mode === "subscription" &&
        session.status === "open" &&
        session.url,
    );
    if (openSession?.url) {
      res.json(CreateBillingCheckoutResponse.parse({ url: openSession.url }));
      return;
    }

    const price = await getPremiumPrice();
    const form = new URLSearchParams({
      mode: "subscription",
      customer: account.stripeCustomerId,
      client_reference_id: userId,
      "line_items[0][price]": price.id,
      "line_items[0][quantity]": "1",
      "metadata[clerkUserId]": userId,
      "metadata[plan]": "premium_monthly",
      "subscription_data[metadata][clerkUserId]": userId,
      "subscription_data[metadata][plan]": "premium_monthly",
      success_url: returnUrls.successUrl,
      cancel_url: returnUrls.cancelUrl,
    });
    const session = await stripeRequest<{ url: string | null }>(
      "/v1/checkout/sessions",
      {
        method: "POST",
        form,
        idempotencyKey: `mandarin-garden-checkout-${account.stripeCustomerId}-${Math.floor(
          Date.now() / 1_800_000,
        )}`,
      },
    );

    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    res.json(CreateBillingCheckoutResponse.parse({ url: session.url }));
  } catch (error) {
    req.log.error({ err: error }, "Could not create a checkout session");
    res.status(503).json({ error: "Checkout is temporarily unavailable." });
  }
});

router.post("/billing/portal", async (req, res): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const parsedBody = CreateBillingPortalBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: "A valid return URL is required." });
    return;
  }

  const returnUrl = safeReturnUrl(
    parsedBody.data.returnUrl,
    req.get("origin"),
  );
  if (!returnUrl) {
    res.status(400).json({ error: "The return URL is not allowed." });
    return;
  }

  try {
    const customer = await getCustomer(userId);
    if (!customer) {
      res.status(404).json({ error: "No Stripe customer found for this account." });
      return;
    }

    const portalReturnUrl = new URL(returnUrl);
    portalReturnUrl.searchParams.set("billing", "returned");
    const form = new URLSearchParams({
      customer: customer.stripeCustomerId,
      return_url: portalReturnUrl.toString(),
    });
    const session = await stripeRequest<{ url: string }>(
      "/v1/billing_portal/sessions",
      { method: "POST", form },
    );
    res.json(CreateBillingPortalResponse.parse({ url: session.url }));
  } catch (error) {
    req.log.error({ err: error }, "Could not create a billing portal session");
    res.status(503).json({ error: "Subscription management is temporarily unavailable." });
  }
});

const billingErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ err: error }, "Billing request failed");
  res.status(502).json({
    error: "The billing service is temporarily unavailable. Please try again.",
  });
};

router.use(billingErrorHandler);

export default router;
