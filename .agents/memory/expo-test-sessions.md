---
name: Expo browser test sessions
description: Limits of authenticated browser verification across the website and Expo preview hosts.
---

Do not treat a successful programmatic Clerk login on the regular website host as authenticated coverage of the separate Expo preview host.

**Why:** The test helper established a website session, but navigating to the Expo host rendered the welcome screen rather than the signed-in parent area. Reusing that browser did not transfer authenticated coverage.

**How to apply:** Confirm the authenticated state on the actual target host before interpreting membership, game or story checks. Clearly separate website/PWA verification from Expo signed-in verification; a welcome-page capture does not verify the latter.
