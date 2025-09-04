# Platform Identification Gotchas

## Platform Name Mismatch in Embed Service [2025-09-03]

The embed service's metadata.ts incorrectly uses display names from stamps.ts to look up platforms, but the platforms object uses internal identifiers as keys. This causes platform lookups to fail when the display name doesn't match the internal identifier.

**Affected Platforms:**
- HumanIdKyc (internal) → Government ID (display)
- HumanIdPhone (internal) → Phone Verification (display)
- CleanHands (internal) → Proof of Clean Hands (display)
- Github (internal) → GitHub (display - case mismatch)
- Linkedin (internal) → LinkedIn (display - case mismatch)

**Working Platforms (lucky matches):**
- Binance → Binance
- Biometrics → Biometrics
- Discord → Discord

**Problem Location:** `embed/src/metadata.ts:44` where it does `platforms[platformName]` using the display name instead of the platform identifier.

**Related Files:**
- embed/src/metadata.ts
- embed/src/stamps.ts
- platforms/src/platforms.ts

## Solution
The proper pattern is to use platform IDs for lookups and display names only for UI presentation.

## platformName Property is Dead Code [2025-09-04]

The `platformName` property was required by BaseHumanIDPlatform but never actually used anywhere in the codebase. It was redundant with `platformId` and has been removed. Only `platformId`, `path`, and `credentialType` are actually needed.

**Related Files:**
- platforms/src/HumanID/shared/BaseHumanIDPlatform.ts