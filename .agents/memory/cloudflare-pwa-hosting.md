---
name: Cloudflare PWA hosting
description: Keep the hosted Mandarin Garden PWA's account and Clerk traffic on the same origin.
---

The Cloudflare-hosted PWA must use a same-origin Pages Function or Worker to proxy `/api/*` to the existing API. Do not deploy it as a static-only site or rely on `_redirects` for a proxy to another domain.

**Why:** Cloudflare Pages `_redirects` supports only same-site proxying. The API's Clerk proxy also needs the original Pages hostname forwarded so it can authenticate the correct host.

**How to apply:** keep the API origin fixed server-side, forward the incoming hostname and protocol, and leave API requests out of the service worker's cache.
