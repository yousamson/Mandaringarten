---
name: Membership progression
description: Paid parent stage choice and per-stage completion XP.
---

Premium monthly membership includes all four stages. Paid parents may freely select any stage; XP must not lock stages. Each stage has its own XP total, and reaching 100 XP marks that stage complete and encourages trying a higher stage. Award and show XP as soon as each answer is correct, not only after a full round; retries must not award it twice. Preserve all XP and the selected stage when signing out and back in. Never charge per-stage unlock fees.

**Why:** the user requires per-answer XP to accumulate and display, alongside free parent selection, per-stage completion encouragement and persistent account progress.

**How to apply:** gate paid learning content by subscription, not earned XP. Save each correct web answer against the stage actually played with a stable retry ID, and update the visible stage total after saving. Use account-owned saved progress for stage selection and completion. Across all website pages, call the product 學習樂園 and avoid 課程/课程 and 費用/费用; use learning content and 訂閱/订阅 instead.

For the garden game, each correct answer earns 1 XP and each incorrect answer removes 1 XP, with balances never below zero. Watering or fertilizing costs 20 XP from the currently selected learning stage. One care action is allowed daily; 10 consecutive care days produce the first bloom and 30 produce a full garden. Missed care gradually reduces growth after five days and returns the garden to seed after 30 days.

**Why:** the user explicitly set the answer reward, penalty, care cost, daily growth milestones, and missed-day decay behavior.

**How to apply:** keep the server ledger authoritative across web and Expo, preserve old XP records during migrations, and use the same selected-stage balance for care deductions.

**Why:** the user wants consistent garden and subscription terminology throughout the website.

The four age stages are 2–3, 4–5, 6–8 and 9–12 years. Free reading cards change with the selected age stage.

**Why:** the user specified「4個階段改為2至3歲，4至5歲，6至8歲，9至12歲，免費閱讀卡片按所選年齡階段改變」.

**How to apply:** keep age labels consistent across languages, selectors and stage cards. Do not change stage identities or erase XP when updating age ranges.
