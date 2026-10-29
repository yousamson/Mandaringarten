---
name: Mandarin Garden billing direction
description: Product billing platform choice and Replit Stripe connector constraint.
---

Mandarin Garden subscriptions are for the web version and use Stripe at US$9.99 per month; no Android release is planned. The Replit Stripe integration is accessed through its connector proxy rather than raw API keys.

**Why:** the user chose Stripe for web billing and changed the product direction to web-only; the connector proxy worked while direct server-key lookup did not.

**How to apply:** keep web checkout and subscription management on Stripe, do not request raw Stripe keys, and verify live-mode/account readiness before describing billing as production-ready.

Keep the presented checkout price in USD when advertising US$9.99/month. A USD-denominated Stripe price alone does not guarantee USD checkout: account-level Adaptive Pricing can localize even a sandbox subscription. Already-localized sessions retain their converted currency after settings change.

**Why:** an end-to-end sandbox check displayed INR despite the underlying monthly price being USD 9.99, so the advertised and presented prices did not match.

**How to apply:** explicitly opt out of Adaptive Pricing per session and do not reuse previously converted open sessions. Verify a newly created sandbox checkout before claiming the USD price is correct.

Do not infer scheduled cancellation solely from Stripe's legacy `cancel_at_period_end` flag. Portal cancellation can instead set `cancel_at` equal to the subscription item's period end while leaving that flag false.

**Why:** the sandbox portal confirmed period-end cancellation while the API's legacy flag remained false; relying on it alone misreported renewal status.

**How to apply:** consider the cancellation timestamp alongside the current period end, and preserve active access until the paid period actually ends.

Checkout idempotency must distinguish a retry from a new purchase after a completed or expired session. Customer plus a time bucket alone is insufficient: Stripe can replay the old completed checkout URL even after the subscription has been canceled.

**Why:** a sandbox cancellation followed by immediate renewal returned the first, already-completed payment page instead of a new checkout.

**How to apply:** include the latest known checkout lifecycle and stable request inputs in the idempotency scope. Reuse genuinely open sessions, but let closed sessions start a new purchase.

The generic Replit Stripe connector proxy can resolve a live price from a development app even when a separate development connection has no test price. Do not assume the proxy selects Stripe mode from `NODE_ENV`.

**Why:** a development-mode API request returned the production live price while the explicit development connection had no matching price.

**How to apply:** require Stripe Price `livemode` to exactly match the app runtime before exposing a plan or creating checkout. Treat development checkout as unavailable until its test-mode price is configured.

Customer ownership must be scoped to the Stripe account and test/live mode, not just the login user. Preserve legacy mappings when reconnecting Stripe or preparing a new sandbox.

**Why:** a saved customer from a different Stripe connection made authenticated access checks fail with “No such customer”, blocking both the parent area and the subscription entry point.

**How to apply:** validate legacy customers against the current connection before reusing them. A definitive missing customer means subscription is required, not active access; network and permission failures must still fail closed.

Concurrent billing reads can exhaust the connector's per-project request limit during a parent-page reload.

**Why:** a sandbox purchase succeeded, but parallel membership/progress checks triggered a connector 429 and briefly showed a billing-panel error.

**How to apply:** share in-flight identical reads and honor bounded rate-limit retries. Do not cache completed entitlement responses merely to suppress errors, since cancellation and renewal must remain visible.

Before sandbox testing, verify Stripe mode through the application's connector transport, not just the first connection returned to the agent.

**Why:** both sandbox and live connections can be attached at once; the development application's default connector resolved a live price while the agent's first connection was an empty sandbox. Development runtime mode alone did not establish payment isolation.

**How to apply:** read the selected price's `livemode` through the same transport as checkout before submitting any test payment. If it is live, stop and resolve development connection routing without modifying live subscriptions.
