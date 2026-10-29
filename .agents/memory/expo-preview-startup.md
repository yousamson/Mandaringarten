---
name: Expo preview startup
description: Cold-start timing when visually verifying Expo web previews.
---

A blank Expo web capture during a cold start may reflect incomplete Metro web bundling rather than a rendering failure.

**Why:** A capture taken while route bundles were still compiling showed an empty screen; after Metro finished bundling, the app rendered normally.

**How to apply:** When the first preview is blank, check workflow logs for completed web bundles and browser errors before changing app code.

Expo development previews must stay on their dedicated Expo origin. Treat the shared `/mobile/` URL as an entry redirect to that origin, not a router basename.

**Why:** Expo Router explicitly ignores base URL stripping in development. A subpath on the shared origin becomes a nonexistent screen, while moving native routes would change deep-link behavior. The main web product must retain `/`.

**How to apply:** Preserve the dedicated native manifest/bundle origin and verify both the shared entry redirect and visible destination screen. Native manifest and bundle checks are separate from a browser capture; neither proves physical-device execution.

Prefer eager web route loading for this preserved preview.

**Why:** On-demand web route chunks repeatedly outlasted preview captures, even with warm Metro bundles, leaving a blank screen. Eager web loading rendered the welcome screen without changing native loading behavior.

**How to apply:** Keep web-only eager loading unless a future change verifies reliable lazy route loading through the Expo preview origin.
