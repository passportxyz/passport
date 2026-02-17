# usePlatforms.tsx - Guards Must Be Symmetric [2026-02-12]

## Issue Description
`usePlatforms.tsx` has two `useMemo` blocks that process custom stamps. If you add a safety guard for unknown `platformType` to one, you **MUST** add it to the other.

## The Two Blocks

### 1. allPlatformDefinitions (reduce)
```typescript
const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[customStamp.platformType];
// Guard needed: platformTypeInfo could be undefined for unknown types
if (!platformTypeInfo) {
  console.warn(`Unknown platformType: ${customStamp.platformType}`);
  return accumulator;
}
// Access platformTypeInfo.basePlatformName (crashes if undefined)
```

### 2. allPlatformsMap (for loop)
```typescript
const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[customStamp.platformType];
// Guard needed: same check
if (!platformTypeInfo) {
  continue;
}
```

## Why This Matters
- `allPlatformDefinitions` accesses `platformTypeInfo.basePlatformName` which crashes if undefined
- This asymmetry was caught by code review and would have crashed the app at runtime
- Both blocks must be kept in sync when adding guards or modifying custom stamp processing

## Related Files
- `app/hooks/usePlatforms.tsx` - Both useMemo blocks
