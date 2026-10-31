---
name: Preview proxy caching
description: Conditional API responses differ between direct Express tests and the shared preview proxy.
---

Validate caching changes through the full preview origin as well as the route in isolation.

**Why:** A conditional plan request returned a complete response in the direct Express regression test but still returned 304 through the shared preview proxy, despite response cache-control headers. A no-store request through the shared client returned the full JSON.

**How to apply:** When investigating missing API data, distinguish an upstream conditional response from an empty application response. Route-level tests alone do not establish the behavior of the proxied client.
