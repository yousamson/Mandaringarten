---
name: Dependency security compatibility
description: Why Expo's transitive merge dependency uses a narrowly scoped replacement.
---

When replacing an unpatched transitive dependency, preserve the parent package's actual API and behavior rather than aliasing an incompatible package directly.

**Why:** Expo needs both ordinary deep merging and a custom array-merging callback for update configuration. The original merge library had no patched release, whereas Fastify's maintained implementation uses a factory API and different option names. A narrow compatibility adapter avoids changing Expo's configuration behavior or maintaining a fork of Expo.

**How to apply:** Keep the adapter scoped to Expo and test nested configuration, custom array merging, cloning, and prototype-poisoning inputs when updating its parent or replacement. Remove it if Expo adopts a safe dependency upstream.

Keep the workspace's minimum package release age enabled during security updates.

**Why:** The newest upstream release may be less than one day old even when an older patched release already fixes the advisory. Package maturity and vulnerability remediation can both be satisfied without weakening the supply-chain safeguard.

**How to apply:** Choose the newest eligible patched release rather than adding release-age exceptions merely to use the latest package.
