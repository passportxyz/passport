---
status: complete
priority: p1
issue_id: "001"
tags: [code-review, security, frontend, crash]
dependencies: []
---

# Missing Unknown platformType Guard in allPlatformDefinitions Memo

## Problem Statement

The `console.warn + continue` safety net for unknown `platformType` values was only added to the **second** `useMemo` (`allPlatformsMap`) but NOT to the **first** `useMemo` (`allPlatformDefinitions`). When the API returns a `platformType` not in `CUSTOM_PLATFORM_TYPE_INFO`, the app crashes with `Cannot read properties of undefined (reading 'basePlatformName')`.

This defeats the entire purpose of the Phase 3 deployment safety net. The app will white-screen for ALL users on affected customizations.

## Findings

**Source:** julik-frontend-races-reviewer (Finding 1)

At `app/hooks/usePlatforms.tsx:100-103`:
```typescript
const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[platformType];
const basePlatformSpecs = platformDefinitions[platformTypeInfo.basePlatformName].PlatformDetails;
// ^ Crashes here when platformTypeInfo is undefined
```

The guard at line 138-141 only protects the second code path:
```typescript
if (!platformTypeInfo) {
  console.warn(`Unknown custom platform type: ${platformType}, skipping`);
  continue;
}
```

## Proposed Solutions

### Solution A: Add matching guard to allPlatformDefinitions reducer (Recommended)
```typescript
const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[platformType];
if (!platformTypeInfo) {
  console.warn(`Unknown custom platform type: ${platformType} for platform ${platformName}, skipping`);
  return customPlatformDefinitions;
}
const basePlatformSpecs = platformDefinitions[platformTypeInfo.basePlatformName].PlatformDetails;
```

- **Pros:** Simple, matches existing pattern, consistent
- **Cons:** None
- **Effort:** Small (5 minutes)
- **Risk:** None

## Recommended Action
Solution A

## Technical Details

### Affected Files
- `app/hooks/usePlatforms.tsx` (line 102)

### Acceptance Criteria
- [ ] Unknown `platformType` in `allPlatformDefinitions` memo logs warning and skips (no crash)
- [ ] Both useMemo blocks handle unknown platformType consistently
- [ ] App renders remaining stamps when one has unknown type

## Work Log
| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-11 | Created from code review | Asymmetric guard - both code paths must be protected |

## Resources
- Plan: `docs/plans/2026-02-11-feat-nft-custom-platform-type-plan.md` (Phase 3, line 184-198)
