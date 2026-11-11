---
name: Clean video capture origins
description: Avoid development-preview banners in exported promotional media.
---

Development-domain pages may contain an informational banner injected outside the app. Capture downloadable videos from the artifact-routed local preview origin used by appPreview instead.

**Why:** A browser recording from the public development domain included a blue preview banner even though the app and appPreview screenshot had no banner.

**How to apply:** For media exports, keep the artifact's full preview-path prefix but use the local preview proxy. Still test the actual user-facing origin separately when checking application behavior.
