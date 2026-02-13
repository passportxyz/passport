# Custom Platform Type System

## Overview
The custom platform type system allows runtime creation of platform stamps with user-defined credentials, enabling partner-specific stamps without code changes. Configuration flows from the scorer API customization endpoint through `useCustomization` to `usePlatforms`.

## CUSTOM_PLATFORM_TYPE_INFO Registry

Located in `app/config/platformMap.ts` (line ~195), this maps `platformType` strings to base platform implementations:

```typescript
const CUSTOM_PLATFORM_TYPE_INFO: Record<string, {
  basePlatformName: string;
  platformClass: typeof Platform;
  platformParams: Record<string, unknown>;
}> = {
  DEVEL: { basePlatformName: "CustomGithub", platformClass: CustomGithubPlatform, platformParams: {} },
  NFT: { basePlatformName: "NFTHolder", platformClass: CustomNFTPlatform, platformParams: {} },
};
```

## Data Flow

1. **Scorer API** returns `customStamps` in customization response
2. **useCustomization** hook fetches and exposes the data
3. **usePlatforms** hook reads `customStamps` and creates dynamic `PlatformProps`
4. Each custom stamp has: `platformName`, `platformType`, `iconUrl`, `displayName`, `description`, `banner`, `credentials`

## Dynamic Platform Instantiation (usePlatforms.tsx)

### Platform ID Convention
Custom platform IDs use `Custom#${platformName}` naming (e.g., `Custom#my-nft-stamp`)

### Two useMemo Blocks
`usePlatforms.tsx` has two useMemo blocks that process custom stamps:
- **allPlatformDefinitions** (reduce): Creates platform instances
- **allPlatformsMap** (for loop): Creates platform map entries

### Instantiation Pattern (lines ~137-169)
```typescript
const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[customStamp.platformType];
const platformInstance = new platformTypeInfo.platformClass(platformTypeInfo.platformParams);
// Platform inherits isEVM from base platform:
// isEVM: platformDefinitions[platformTypeInfo.basePlatformName]?.PlatformDetails?.isEVM
```

### Key Properties
- **isEVM**: Inherited from base platform (no override at custom level)
- **Credentials**: Map to provider specs with providerId, displayName, description
- **Banners**: Customizable (header, content, CTA) per custom stamp
- **Icon/name/description**: Can be overridden from base platform

## Adding a New Custom Platform Type

1. Create platform package following CustomGithub/CustomNFT pattern
2. Register entry in `CUSTOM_PLATFORM_TYPE_INFO` with `basePlatformName`, `platformClass`, `platformParams`
3. Add guard in **BOTH** `allPlatformDefinitions` AND `allPlatformsMap` memos in `usePlatforms.tsx`
4. Add provider ID template to `types/src/index.d.ts`
5. For condition-based providers: add prefix to `CONDITION_BASED_PREFIXES` array in `identity/src/verification.ts`

## Backend Integration

### Provider ID Format
Condition-based providers use: `{Type}#name#hash` (e.g., `NFTHolder#name#hash`, `DeveloperList#name#hash`)

### Verification (identity/src/verification.ts)
- `parseConditionBasedType` utility handles prefix-based provider IDs
- Shared between DeveloperList and NFTHolder prefixes
- `groupProviderTypesByPlatform` has prefix-based detection for dynamic provider IDs

## Key Files
- `app/config/platformMap.ts` - CUSTOM_PLATFORM_TYPE_INFO registry
- `app/hooks/usePlatforms.tsx` - Dynamic platform instantiation
- `identity/src/verification.ts` - Backend verification with condition-based types
- `platforms/src/CustomGithub/` - Reference DEVEL type implementation
- `platforms/src/CustomNFT/` - Reference NFT type implementation
- `types/src/index.d.ts` - Provider ID type definitions
