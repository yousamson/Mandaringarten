import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import express from "express";
import { build } from "esbuild";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(testDir, "..");
const tempDir = await mkdtemp(path.join(packageDir, ".billing-route-test-"));
const fixturePrice = {
  id: "price_test_validated_monthly",
  active: true,
  currency: "usd",
  unit_amount: 999,
  livemode: false,
  recurring: { interval: "month" },
};

const stubs = {
  auth: `export function getAuth(req) { return { userId: req.testUserId ?? null }; }`,
  apiZod: `
    export const CreateBillingCheckoutBody = {
      safeParse(value) { return { success: true, data: value }; },
    };
    export const CreateBillingCheckoutResponse = { parse(value) { return value; } };
    export const CreateBillingPortalBody = { safeParse(value) { return { success: true, data: value }; } };
    export const CreateBillingPortalResponse = { parse(value) { return value; } };
    export const GetBillingPlanResponse = { parse(value) { return value; } };
    export const GetBillingStatusResponse = { parse(value) { return value; } };
    export const GetBillingSubscriptionResponse = { parse(value) { return value; } };
  `,
  db: `
    export const checkoutConsentsTable = {};
    export const db = {
      update() {
        return { set() { return { where: async () => undefined }; } };
      },
    };
  `,
  drizzle: `export function eq(...args) { return args; }`,
  legal: `export const POLICY_VERSION = "test-policy"; export async function hasCurrentConsent() { return true; }`,
  stripeCustomers: `
    export async function getCustomer() { return { stripeCustomerId: "cus_test_fixture" }; }
    export async function getOrCreateCustomer() { return { stripeCustomerId: "cus_test_fixture" }; }
  `,
  stripeClient: `
    export async function stripeRequest(endpoint, options = {}) {
      const state = globalThis.__billingRouteTestState;
      const url = new URL(endpoint, "https://stripe.test");
      if (url.pathname === "/v1/prices") {
        const price = state.prices[Math.min(state.priceLookups.length, state.prices.length - 1)];
        state.priceLookups.push(price.id);
        return { data: [price] };
      }
      if (url.pathname === "/v1/subscriptions") return { data: state.subscriptions };
      if (url.pathname === "/v1/checkout/sessions" && (options.method ?? "GET") === "GET") {
        return { data: state.sessions };
      }
      if (url.pathname === "/v1/checkout/sessions" && options.method === "POST") {
        state.checkoutForms.push(options.form);
        return { id: "cs_test_fixture_" + state.checkoutForms.length, url: "https://checkout.stripe.test/session" };
      }
      if (url.pathname === "/v1/billing_portal/sessions" && options.method === "POST") {
        state.portalForms.push(options.form);
        return { url: "https://billing.stripe.test/session" };
      }
      if (url.pathname.startsWith("/v1/subscriptions/") && options.method === "DELETE") {
        state.cancelledSubscriptions.push(url.pathname.split("/").at(-1));
        return { id: url.pathname.split("/").at(-1), status: "canceled" };
      }
      throw new Error("Unexpected Stripe fixture request: " + endpoint);
    }
  `,
  subscriptionState: `
    export function cancellationAtPeriodEnd(subscription, periodEnd) {
      return subscription?.cancel_at_period_end === true ||
        (periodEnd !== null && subscription?.cancel_at === periodEnd);
    }
    export function checkoutIdempotencyKey() { return "billing-route-test-key"; }
  `,
  accountLifecycle: `
    export async function withAccountWrite(_userId, operation) {
      return operation({
        insert() {
          return { values() { return { returning: async () => [{ id: "consent_test_fixture" }] }; } };
        },
      });
    }
  `,
  admin: `export async function isAdministrator() { return false; }`,
};

const stubPaths = {};
for (const [name, contents] of Object.entries(stubs)) {
  const stubPath = path.join(tempDir, `${name}.mjs`);
  await writeFile(stubPath, contents);
  stubPaths[name] = stubPath;
}

const routeBundlePath = path.join(tempDir, "billing-route.mjs");
await build({
  entryPoints: [path.join(packageDir, "src/routes/billing.ts")],
  outfile: routeBundlePath,
  bundle: true,
  platform: "node",
  format: "esm",
  external: ["express"],
  plugins: [{
    name: "billing-route-test-dependencies",
    setup(buildApi) {
      const aliases = new Map([
        ["@clerk/express", stubPaths.auth],
        ["@workspace/api-zod", stubPaths.apiZod],
        ["@workspace/db", stubPaths.db],
        ["drizzle-orm", stubPaths.drizzle],
        ["../legal", stubPaths.legal],
        ["../stripe-customers", stubPaths.stripeCustomers],
        ["../stripeClient", stubPaths.stripeClient],
        ["../subscription-state", stubPaths.subscriptionState],
        ["../account-lifecycle", stubPaths.accountLifecycle],
        ["../admin", stubPaths.admin],
      ]);
      buildApi.onResolve({ filter: /.*/ }, (args) => {
        const stubPath = aliases.get(args.path);
        return stubPath ? { path: stubPath } : undefined;
      });
    },
  }],
});

const { default: billingRouter } = await import(pathToFileURL(routeBundlePath).href);
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.testUserId = "parent_test_fixture";
  req.log = { error() {} };
  next();
});
app.use("/api", billingRouter);
const server = app.listen(0);
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});
const baseUrl = `http://127.0.0.1:${server.address().port}`;

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  delete globalThis.__billingRouteTestState;
  await rm(tempDir, { recursive: true, force: true });
});

function setFixture(price) {
  globalThis.__billingRouteTestState = {
    prices: [price],
    priceLookups: [],
    checkoutForms: [],
    portalForms: [],
    subscriptions: [],
    sessions: [],
    cancelledSubscriptions: [],
  };
}

async function getPlan() {
  return fetch(`${baseUrl}/api/billing/plan`);
}

test("production rejects a Stripe test-mode price", async () => {
  const previousMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  setFixture(fixturePrice);
  try {
    const response = await getPlan();
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      error: "The monthly plan is temporarily unavailable.",
    });
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
  }
});

test("production accepts a matching live-mode price", async () => {
  const previousMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  setFixture({ ...fixturePrice, id: "price_live_validated_monthly", livemode: true });
  try {
    const response = await getPlan();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).priceLabel, "US$9.99");
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
  }
});

test("development accepts a matching Stripe test-mode price", async () => {
  const previousMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  setFixture(fixturePrice);
  try {
    const response = await getPlan();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).priceLabel, "US$9.99");
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
  }
});

test("development rejects a live-mode price", async () => {
  const previousMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  setFixture({ ...fixturePrice, id: "price_live_mismatch", livemode: true });
  try {
    assert.equal((await getPlan()).status, 503);
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
  }
});

test("parent can return to the billing portal and sees renewal restored", async () => {
  const previousMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  setFixture(fixturePrice);
  const state = globalThis.__billingRouteTestState;
  const currentPeriodEnd = 1_800_000_000;
  state.subscriptions = [{
    id: "sub_scheduled_cancel",
    status: "active",
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: false,
    cancel_at: currentPeriodEnd,
    items: { data: [{ price: { id: fixturePrice.id }, current_period_end: currentPeriodEnd }] },
  }];

  try {
    const beforeResume = await fetch(`${baseUrl}/api/billing/status`);
    assert.equal(beforeResume.status, 200);
    assert.deepEqual(await beforeResume.json(), {
      isPremium: true,
      subscriptionStatus: "active",
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
      cancelAtPeriodEnd: true,
    });

    const portalResponse = await fetch(`${baseUrl}/api/billing/portal`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({ returnUrl: "http://localhost:3000/parent" }),
    });
    assert.equal(portalResponse.status, 200);
    assert.equal((await portalResponse.json()).url, "https://billing.stripe.test/session");
    assert.equal(state.portalForms.length, 1);
    assert.equal(state.portalForms[0].get("customer"), "cus_test_fixture");
    assert.equal(
      state.portalForms[0].get("return_url"),
      "http://localhost:3000/parent?billing=returned",
    );

    // Model Stripe applying the portal's resume action before the parent
    // page reloads and requests its authenticated billing status again.
    state.subscriptions[0].cancel_at_period_end = false;
    state.subscriptions[0].cancel_at = null;
    const afterResume = await fetch(`${baseUrl}/api/billing/status`);
    assert.equal(afterResume.status, 200);
    assert.deepEqual(await afterResume.json(), {
      isPremium: true,
      subscriptionStatus: "active",
      currentPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    });
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
  }
});

test("checkout submits the exact test price returned by successful plan validation", async () => {
  const previousMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  setFixture(fixturePrice);
  globalThis.__billingRouteTestState.prices = [
    { ...fixturePrice, id: "price_subscription_lookup" },
    { ...fixturePrice, id: "price_checkout_validation" },
  ];
  try {
    const response = await fetch(`${baseUrl}/api/billing/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        returnUrl: "http://localhost:3000/parent",
        privacyAccepted: true,
        disclaimerAccepted: true,
        noRefundAccepted: true,
        policyVersion: "2026-10-29.1",
      }),
    });

    assert.equal(response.status, 200);
    assert.equal((await response.json()).url, "https://checkout.stripe.test/session");
    assert.deepEqual(globalThis.__billingRouteTestState.priceLookups, [
      "price_subscription_lookup",
      "price_checkout_validation",
    ]);
    assert.equal(globalThis.__billingRouteTestState.checkoutForms.length, 1);
    assert.equal(
      globalThis.__billingRouteTestState.checkoutForms[0].get("line_items[0][price]"),
      "price_checkout_validation",
    );
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
  }
});

test("declined incomplete checkout can be retried and activates only after Stripe reports success", async () => {
  const previousMode = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  setFixture(fixturePrice);
  const state = globalThis.__billingRouteTestState;
  state.subscriptions = [{
    id: "sub_declined",
    status: "incomplete",
    items: { data: [{ price: { id: fixturePrice.id } }] },
  }];

  try {
    const declinedStatus = await fetch(`${baseUrl}/api/billing/status`);
    assert.equal(declinedStatus.status, 200);
    assert.equal((await declinedStatus.json()).isPremium, false);

    const createCheckout = () => fetch(`${baseUrl}/api/billing/checkout`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        returnUrl: "http://localhost:3000/parent",
        privacyAccepted: true,
        disclaimerAccepted: true,
        noRefundAccepted: true,
        policyVersion: "2026-10-29.1",
      }),
    });

    const retryResponse = await createCheckout();
    assert.equal(retryResponse.status, 200);
    assert.deepEqual(state.cancelledSubscriptions, ["sub_declined"]);
    assert.equal(state.checkoutForms.length, 1);

    // A still-open session can be retried directly rather than replaced.
    state.subscriptions = [{
      id: "sub_retry_incomplete",
      status: "incomplete",
      items: { data: [{ price: { id: fixturePrice.id } }] },
    }];
    state.sessions = [{
      id: "cs_retry_open",
      client_reference_id: "parent_test_fixture",
      mode: "subscription",
      status: "open",
      url: "https://checkout.stripe.test/retry",
      metadata: { currencyPolicy: "usd-only-v1", policyVersion: "test-policy" },
    }];

    const reuseResponse = await createCheckout();
    assert.equal(reuseResponse.status, 200);
    assert.equal((await reuseResponse.json()).url, "https://checkout.stripe.test/retry");
    assert.equal(state.checkoutForms.length, 1);
    assert.deepEqual(state.cancelledSubscriptions, ["sub_declined"]);

    // Stripe's confirmed active subscription is the sole source of entitlement;
    // another checkout attempt is rejected instead of creating a duplicate.
    state.sessions = [];
    state.subscriptions = [{
      id: "sub_successful_retry",
      status: "active",
      items: { data: [{ price: { id: fixturePrice.id } }] },
    }];
    const statusResponse = await fetch(`${baseUrl}/api/billing/status`);
    assert.equal(statusResponse.status, 200);
    assert.equal((await statusResponse.json()).isPremium, true);

    const duplicateResponse = await createCheckout();
    assert.equal(duplicateResponse.status, 409);
    assert.equal(state.checkoutForms.length, 1);
    assert.equal(state.subscriptions.filter((subscription) => subscription.status === "active").length, 1);
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
  }
});
