---
name: Cloudflare PWA hosting
description: Keep the hosted Mandarin Garden PWA's account and Clerk traffic on the same origin.
---

The Cloudflare-hosted PWA must use a same-origin Pages Function or Worker to proxy `/api/*` to the existing API. Do not deploy it as a static-only site or rely on `_redirects` for a proxy to another domain.

**Why:** Cloudflare Pages `_redirects` supports only same-site proxying. Replit-managed Clerk also rejects an unregistered `pages.dev` host (`host_invalid`), even when an API Worker preserves that hostname.

**How to apply:** keep the API origin fixed server-side and leave API requests out of the service worker's cache. Before switching a production PWA to Pages, ensure its custom domain is registered with Replit-managed Clerk and the browser Origin matches that recognized host. Never strip or spoof Origin to bypass Clerk validation.

For Mandarin Garden, keep the Replit-registered apex `mandaringarden.asia` as the Clerk proxy URL and serve the Pages PWA from `www.mandaringarden.asia` through an external CNAME to the project’s `pages.dev` hostname. The Pages Worker sends the apex as the canonical proxy host while preserving the browser’s `www` Origin.

**Why:** Replit-managed Clerk accepts the registered apex and its `www` subdomain Origin, while the Pages subdomain can use Name.com DNS without transferring all nameservers or moving the existing apex website.

**How to apply:** keep the apex on Replit; do not switch the domain’s nameservers for this PWA. Verify the `www` CNAME and the Replit backend publication before expecting production sign-in to work.

Pages Direct Upload manifests require URL paths with leading slashes, despite the API schema's relative-path example.

**Why:** relative keys were accepted with a successful deployment status but static pages returned 404. Deployment success alone does not establish site readiness.

**How to apply:** normalize manifest paths to `/...`; verify the stable hostname's homepage, deep links, and API after deployment.

Internal API redirects must remain on the Pages origin.

**Why:** Clerk's versioned script redirects can point back to the backend origin, introducing cross-origin loading failures even when the API health check succeeds.

**How to apply:** rewrite only redirects to the fixed backend origin under `/api/`; preserve external payment destinations.

