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
