---
name: Mandarin Garden billing direction
description: Product billing platform choice and Replit Stripe connector constraint.
---

Mandarin Garden subscriptions are for the web version and use Stripe at US$9.99 per month; no Android release is planned. The Replit Stripe integration is accessed through its connector proxy rather than raw API keys.

**Why:** the user chose Stripe for web billing and changed the product direction to web-only; the connector proxy worked while direct server-key lookup did not.

**How to apply:** keep web checkout and subscription management on Stripe, do not request raw Stripe keys, and verify live-mode/account readiness before describing billing as production-ready.
