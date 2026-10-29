---
name: Expo preview startup
description: Cold-start timing when visually verifying Expo web previews.
---

A blank Expo web capture during a cold start may reflect incomplete Metro web bundling rather than a rendering failure.

**Why:** A capture taken while route bundles were still compiling showed an empty screen; after Metro finished bundling, the app rendered normally.

**How to apply:** When the first preview is blank, check workflow logs for completed web bundles and browser errors before changing app code.
