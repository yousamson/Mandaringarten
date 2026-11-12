---
name: Product platform direction
description: User decision to align web and Expo app content and billing while pursuing non-Apple and non-Google distribution.
---

The user wants the Mandarin Garden website and Expo app to present the same learning content, stage choices, and persistent progress, while retaining Stripe for subscriptions. They do not plan to publish through Apple App Store or Google Play; they chose an installable website PWA as the distribution route.

**Why:** The user explicitly asked for the mobile app to match the website, keep Stripe, and explore distribution outside Apple and Google.

**How to apply:** Keep the web and Expo experiences on the same source of learning content and account progress. Use Stripe for subscriptions across the product. Treat the website PWA as the preferred installable mobile distribution channel; do not prepare Apple or Google store builds unless the user changes this direction.

Keep the installed app's display name and bootstrap/loading screen language-neutral: use the English “Mandarin Garden” label and existing app icon while Clerk initializes, then preserve the user's selected localized interface after loading.

**Why:** the user asked for the installed app and its waiting screen to use only the English brand name, without Chinese text, while other screens remain localized.

**How to apply:** update Expo and PWA installed-app labels plus the loading gate; do not replace Chinese translations in the loaded app.
