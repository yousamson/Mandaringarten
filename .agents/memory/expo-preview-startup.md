---
name: Expo preview startup
description: Cold-start timing when visually verifying Expo web previews.
---

A blank Expo web capture during a cold start may reflect incomplete Metro web bundling rather than a rendering failure.

**Why:** A capture taken while route bundles were still compiling showed an empty screen; after Metro finished bundling, the app rendered normally.

**How to apply:** When the first preview is blank, check workflow logs for completed web bundles and browser errors before changing app code.

Relocating the Expo preview below `/mobile/` is not verified merely by a healthy Metro workflow. In this workspace, the subpath returned a router 404 after bundling; neither adding `EXPO_BASE_URL` to service environment nor temporarily setting Expo's experimental base URL resolved it.

**Why:** The web product became the root entry, but native Expo service health did not prove that its relocated browser route worked.

**How to apply:** Verify the actual subpath response separately from Expo Go/native availability. Do not repeat those two configuration guesses or claim the mobile browser preview is restored without a successful response.
