---
name: Product platform direction
description: User decision to prioritize the web experience and preserve the native app separately.
---

The user chose to switch Mandarin Garden to a web app using Stripe, with the intention of publishing through Replit. Phone browsers are a first-class website target, especially for games and short reading. Preserve the existing Expo app rather than deleting it; native store billing remains a separate concern.

**Why:** The user explicitly selected “改做網頁版並使用 Stripe” instead of using Stripe for native in-app purchases, and has repeatedly required the website to fit phone screens.

**How to apply:** Treat web membership as the main delivery path and verify responsive behavior on phone widths, particularly for games and reading. Do not replace native RevenueCat billing with web Stripe checkout or remove the preserved native product without a new user instruction.
