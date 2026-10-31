---
name: Cloudflare PWA hosting
description: Keep the hosted Mandarin Garden PWA's account and Clerk traffic on the same origin.
---

The Cloudflare-hosted PWA must use a same-origin Pages Function or Worker to proxy `/api/*` to the existing API. Do not deploy it as a static-only site or rely on `_redirects` for a proxy to another domain.

**Why:** Cloudflare Pages `_redirects` supports only same-site proxying. The API's Clerk proxy also needs the original Pages hostname forwarded so it can authenticate the correct host.

**How to apply:** keep the API origin fixed server-side, forward the incoming hostname and protocol, and leave API requests out of the service worker's cache.

Pages Direct Upload manifests require URL paths with leading slashes, despite the API schema's relative-path example.

**Why:** relative keys were accepted with a successful deployment status but static pages returned 404. Deployment success alone does not establish site readiness.

**How to apply:** normalize manifest paths to `/...`; verify the stable hostname's homepage, deep links, and API after deployment.

Internal API redirects must remain on the Pages origin.

**Why:** Clerk's versioned script redirects can point back to the backend origin, introducing cross-origin loading failures even when the API health check succeeds.

**How to apply:** rewrite only redirects to the fixed backend origin under `/api/`; preserve external payment destinations.
