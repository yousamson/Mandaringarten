---
name: Legacy progress migration
description: Why browser-only XP is reconciled against the round ledger rather than imported once per account.
---

Legacy browser snapshots overlap across devices; treat them as a high-water baseline, never as additive awards or as a once-per-account import. Server-earned rounds remain separate from that old baseline.

**Why:** One family can return with a higher old snapshot from another browser after the first migration, and may already have earned new server XP. A permanent migrated flag loses the higher snapshot; adding whole snapshots or ignoring newer round awards either duplicates or loses XP.

**How to apply:** Reconcile each stage against its legacy portion plus the distinct server round ledger, never reduce saved XP, and retain the same round ID through retries. A queued round belongs to the stage played even when another device changes the parent's selected stage.
