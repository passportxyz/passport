### [20:17] [architecture] Custom Platform Type System for Dynamic Stamps
**Details**: The Gitcoin Passport codebase implements a sophisticated custom platform type system that allows runtime creation of platform stamps with user-defined credentials. This system is used for partner-specific stamps without requiring code changes.

## Key Components:

1. **CUSTOM_PLATFORM_TYPE_INFO Configuration** (app/config/platformMap.ts:195)
   - Maps custom platform types to base platform implementations
   - Example: DEVEL type maps to CustomGithub platform
   - Stores platformClass and platformParams needed for instantiation
   - Currently only has DEVEL defined, but extensible for NFT, EVM, or other custom types

2. **usePlatforms Hook** (app/hooks/usePlatforms.tsx)
   - Reads customStamps from useCustomization hook
   - Each customStamp has: platformName, platformType, iconUrl, displayName, description, banner, credentials
   - Creates dynamic PlatformProps using CUSTOM_PLATFORM_TYPE_INFO[platformType]
   - Generates platformId as `Custom#${platformName}`
   - Inherits isEVM, icon, name, description from base platform specs

3. **Dynamic Platform Instantiation Pattern** (lines 137-169)
   - New platformTypeInfo.platformClass instance created with platformParams
   - Platform banners can be customized (header, content, CTA)
   - Credentials map to provider specs with providerId, displayName, description
   - Result: Map entry with platform instance and platFormGroupSpec array

4. **Integration Points**:
   - ScrollConnectGithub.tsx: Shows real-world usage with DEVEL custom type
   - Tests mock CUSTOM_PLATFORM_TYPE_INFO for custom platform testing
   - AllowList platform handles custom stamps similar pattern

## For NFT/DEVEL/Custom Stamps:

The pattern shows that adding a new custom platform type requires:
1. Define entry in CUSTOM_PLATFORM_TYPE_INFO with: basePlatformName, platformClass, platformParams
2. Ensure backend customization API returns customStamps in user's customization response
3. Frontend dynamically creates platforms at runtime with custom provider IDs
4. Each custom stamp can have unique banner, icon, display name, description
5. Inherits isEVM flag and behavioral properties from base platform

## Key Design Decisions:

- Platform IDs must be unique: uses Custom#{platformName} naming convention
- No separate Provider implementations needed - reuses base platform logic
- platformType acts as versioning/behavior selector (DEVEL, NFT, etc.)
- Credentials array defines which providers/stamps appear in the UI
- isEVM inheritance allows custom stamps to participate in auto-verification if base platform supports it
- No modifications to platforms registry needed - entirely driven by customization API

## Important Notes:

- customPlatforms are instantiated fresh each render via useMemo
- Banner configuration is flexible (can be header-only, content-only, with CTA, etc.)
- Custom platform specs inherit all properties from base platform except icon/name/description which can be overridden
- The system avoids code duplication by reusing existing Platform/Provider implementations
**Files**: app/hooks/usePlatforms.tsx, app/config/platformMap.ts, app/components/scroll/ScrollConnectGithub.tsx, app/__tests__/hooks/usePlatforms.test.ts
---

### [20:17] [pattern] On-Chain EVM Platform Verification Pattern
**Details**: The isEVM flag is a unified architectural pattern for enabling EVM-based auto-verification on custom and standard platforms.

## Architecture:

The isEVM flag has a **single source of truth** on PlatformSpec (in Providers-config.ts):
- **Backend**: Auto-verification reads PlatformDetails.isEVM to determine eligibility
- **Frontend**: PlatformProps carries isEVM from PlatformDetails via derivation in platformMap.ts
- **Custom Platforms**: Inherit isEVM from their base platform (line 167 in usePlatforms.tsx)

## Key Points for NFT/Custom Platforms:

1. **If basing custom platform on NFT or ETH (both isEVM: true)**:
   - Custom stamps automatically eligible for auto-verification
   - No additional configuration needed beyond base platform selection

2. **If basing on non-EVM platform (Civic, TrustaLabs, ZKEmail - no isEVM)**:
   - Custom stamps will NOT be eligible for auto-verification
   - Intentional design - these platforms not compatible with EVM auto-verify flow

3. **Custom Platform isEVM Inheritance** (usePlatforms.tsx:167):
   ```typescript
   isEVM: platformDefinitions[platformTypeInfo.basePlatformName]?.PlatformDetails?.isEVM
   ```
   - Directly inherited from base platform
   - No way to override at custom platform level
   - Simplifies architecture, prevents misconfiguration

## For NFT-Based Custom Stamps:

If implementing NFT platform type for custom stamps:
1. NFT base platform already has isEVM flag defined
2. Custom NFT stamps will inherit this automatically
3. Custom stamp providers will be eligible for auto-verification if NFT is isEVM-compatible
4. No separate configuration needed for EVM eligibility
**Files**: platforms/src/types.ts, app/components/GenericPlatform.tsx, app/config/platformMap.ts, identity/src/autoVerification.ts
---

### [20:17] [pattern] Provider Error Handling and Verification Philosophy
**Details**: The verification system follows a specific error handling philosophy that applies to all providers including custom ones.

## Core Philosophy:

1. **NO try-catch at top level of verify() methods**
   - Let errors bubble up naturally for proper debugging
   - Ensures unexpected failures are noticed immediately
   - Makes error tracking and logging more reliable

2. **Expected vs Unexpected Failures**
   - **Expected failures** (data validation, user didn't meet criteria): Return `{ valid: false, errors: [...] }`
   - **Unexpected failures** (network issues, SDK failures): Let them throw
   - Higher-level error handling in IAM service catches provider errors

3. **Error Flow**:
   - Provider verify() returns VerifiedPayload with optional errors[] field
   - Identity layer (verification.ts) catches errors and truncates to 1000 chars
   - Auto-verification filters for successful credentials only (error info lost currently)
   - Embed service endpoints don't expose error info to clients

## For Custom NFT/On-Chain Providers:

- If checking on-chain data fails: return `{ valid: false, errors: ["Not found"], record: {...} }`
- If network call fails unexpectedly: let error throw (will be caught by identity layer)
- Don't wrap verification in try-catch
- Record field is ignored by consumers when valid=false, so can be partially populated

## Important Notes:

- Currently, error information is captured but lost when filtering for successful credentials
- This is noted as a potential improvement (credential_verification_error_handling.md)
- For custom stamps, leverage existing provider error handling patterns
**Files**: conventions/error_handling.md, identity/src/verification.ts, platforms/src/CleanHands/Providers/index.ts
---

### [20:17] [convention] Platform ID vs Display Name Separation
**Details**: Critical convention: Always use Platform IDs for programmatic lookups, never display names.

## Identifiers:

1. **Platform ID** (Internal Key)
   - Used in platforms.ts as object keys
   - Used in Providers-config.ts as 'platform' field
   - Examples: HumanIdKyc, CustomGithub, NFT, CleanHands
   - **For custom platforms**: Custom#{platformName} pattern

2. **Display Name** (UI Only)
   - Human-readable shown in UI
   - Stored in Providers-config.ts as 'name' field
   - Examples: "Government ID", "GitHub", "Proof of Clean Hands"
   - **Never use for lookups or programmatic access**

## Related Gotcha:

embed/src/metadata.ts had a bug (platform_identification gotcha) where it used display names to look up platforms instead of IDs. This caused failures for: HumanIdKyc→Government ID, HumanIdPhone→Phone Verification, CleanHands→Proof of Clean Hands, Github→GitHub, Linkedin→LinkedIn.

## For Custom Platforms:

- Custom platform IDs: Custom#{platformName} (frontend naming convention)
- Backend uses platformName directly from customization API
- Always reference via ID in config, never by display name
- Display name can be any user-friendly string set via customization API

## Files Affected:

- platforms/src/platforms.ts - Platform registry
- embed/src/stamps.ts - Stamp metadata with display names
- embed/src/metadata.ts - Service that was doing incorrect lookups
- platformMap.ts - Both standard and custom platform registration
**Files**: architecture/platform_system.md, gotchas/platform_identification.md
---

### [20:17] [pattern] HumanID Platform Dual-Path Architecture for Reference
**Details**: HumanID platforms demonstrate two distinct on-chain verification patterns that could inform NFT platform design.

## Two Verification Paths:

### 1. SBT Path (HumanIdKyc, HumanIdPhone, Biometrics)
- Uses sbtFetcher to retrieve on-chain SBTs
- Validation checks: publicValues array (min 5 elements), nullifier at index 3, expiry (>= not >)
- Providers extend BaseHumanIdProvider (inherited validation)
- Frontend extends BaseHumanIDPlatform with sbtFetcher

### 2. Attestation Path (CleanHands) 
- Uses Sign Protocol attestations via attestationFetcher
- Validation: checks indexingValue field (must exist and non-empty)
- Standalone provider (doesn't inherit BaseHumanIdProvider)
- Frontend extends BaseHumanIDPlatform but uses attestationFetcher instead

## Key Pattern Decisions:

- **Shared validation logic** in HumanID/shared/utils.ts (both frontend and backend use)
- **Constants for credential types** prevent magic strings
- **Record field is ignored when valid=false** so no need to perfectly populate it
- **Separate paths avoid forced patterns** - attestations not forced into SBT structure

## Lessons for Custom NFT Platforms:

1. On-chain verification can support multiple data sources (SBTs, NFTs, attestations)
2. Clean separation of concerns: frontend gets data, providers validate data
3. Shared validation patterns reduce duplication
4. Use constants for credential type strings
5. Expected vs unexpected errors: validation failures return {valid:false}, data access failures should throw
**Files**: patterns/humanid_platforms.md, platforms/src/HumanID/shared/
---

### [20:18] [architecture] Custom Platform Type System for NFT stamps
**Details**: The custom platform system works through CUSTOM_PLATFORM_TYPE_INFO registry in app/config/platformMap.ts (line 195). Currently only DEVEL type exists, mapping to CustomGithub platform. Adding a new NFT type requires: 1) Entry in CUSTOM_PLATFORM_TYPE_INFO with basePlatformName, platformClass, and platformParams, 2) A platform class (like NFTPlatform) that extends Platform with getProviderPayload returning empty object (no OAuth), 3) Backend provider handling in identity/src/verification.ts verifyTypes() for the new provider type prefix, 4) The customStamps config comes from the scorer API customization endpoint and flows through useCustomization -> usePlatforms hook. The NFTPlatform at platforms/src/NFT/App-Bindings.ts is a wallet-only platform (isEVM=true, no OAuth) that returns empty payload, making it ideal as a base for custom NFT stamps.
**Files**: app/config/platformMap.ts, app/hooks/usePlatforms.tsx, platforms/src/NFT/App-Bindings.ts, identity/src/verification.ts, app/utils/customizationUtils.tsx
---

### [22:01] [architecture] CustomNFT platform package structure and design
**Details**: Created CustomNFT platform at platforms/src/CustomNFT/ following the CustomGithub pattern. Key design decisions:

1. **Platform ID**: "NFTHolder" (used consistently as platformId, path, platform in PlatformSpec, and provider type)
2. **App-Bindings**: Wallet-only flow (no OAuth), extends Platform directly. Returns empty payload since verification is on-chain.
3. **Provider**: NFTHolderProvider fetches conditions from scorer API (`SCORER_ENDPOINT/internal/customization/credential`), then checks on-chain NFT balanceOf via JSON-RPC eth_call. Uses OR logic across contracts (any match is sufficient).
4. **Icon**: Reuses existing nftStampIcon.svg from NFT platform
5. **isEVM**: true (requires wallet connection for on-chain verification)
6. **ProviderConfig**: Empty array — custom stamp credentials come dynamically from the API
7. **RPC URLs**: Supports chainIds 1 (mainnet), 10 (optimism), 137 (polygon), 42161 (arbitrum), 8453 (base) via environment variables
8. **File extension**: Uses .ts (not .tsx) for App-Bindings since there's no JSX
**Files**: platforms/src/CustomNFT/App-Bindings.ts, platforms/src/CustomNFT/Providers-config.ts, platforms/src/CustomNFT/Providers/nftHolder.ts, platforms/src/CustomNFT/Providers/index.ts, platforms/src/CustomNFT/index.ts
---

### [22:03] [architecture] CustomNFT platform package structure
**Details**: CustomNFT platform package created at platforms/src/CustomNFT/ following the CustomGithub pattern. Key points:
- platformId = "NFTHolder" (not "NFT" which is the static NFT platform)
- Wallet-only flow (no OAuth) - getProviderPayload returns {}
- NFTHolderProvider fetches conditions from SCORER_ENDPOINT/internal/customization/credential/ and checks balanceOf via JSON-RPC
- Registered as "NFT" in CUSTOM_PLATFORM_TYPE_INFO (platformMap.ts)
- Provider IDs use format: NFTHolder#name#hash (matching DeveloperList# pattern)
- isEVM: true by default, can be overridden per-stamp via API
- verification.ts uses shared parseConditionBasedType utility for both DeveloperList and NFTHolder prefixes
- groupProviderTypesByPlatform has prefix-based detection for dynamic provider IDs
**Files**: platforms/src/CustomNFT/index.ts, platforms/src/CustomNFT/App-Bindings.ts, platforms/src/CustomNFT/Providers-config.ts, platforms/src/CustomNFT/Providers/nftHolder.ts, app/config/platformMap.ts, app/hooks/usePlatforms.tsx, identity/src/verification.ts
---

