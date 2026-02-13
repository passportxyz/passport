# Platform System Architecture

## Platform Identification System

Each platform in the codebase has multiple identifiers that serve different purposes:

### 1. Platform ID (Internal Key)
- Used in `platforms/src/platforms.ts` as object keys
- Used in Providers-config.ts as the 'platform' field
- Examples: `HumanIdKyc`, `HumanIdPhone`, `CleanHands`, `Github`, `Linkedin`
- **This is the canonical identifier for programmatic lookups**

### 2. Display Name
- Human-readable name shown in the UI
- Stored in Providers-config.ts as the 'name' field
- Examples: "Government ID", "Phone Verification", "Proof of Clean Hands", "GitHub", "LinkedIn"
- **Only for UI presentation, never for lookups**

### 3. Platform Class
- The actual class implementation in App-Bindings.tsx
- Implements the Platform interface with methods like `getProviderPayload()`

## Frontend/Backend Split Architecture

The platforms package has a unique architecture where both frontend and backend code coexist:

### Frontend Components
- **Location**: `platforms/src/*/App-Bindings.tsx/ts` files
- **Purpose**: Handle user interactions and authentication flows
- **Implementation**: Extend Platform class, implement `getProviderPayload()` method
- **Responsibilities**:
  - OAuth URL generation
  - Wallet connection flows
  - UI flow orchestration
  - User-facing authentication

### Backend Components  
- **Location**: `platforms/src/*/Providers/*.ts` files
- **Purpose**: Handle verification logic and credential issuance
- **Implementation**: Implement Provider interface with `verify()` method
- **Responsibilities**:
  - API calls to external services
  - On-chain verification checks
  - Credential issuance
  - Token validation

### Shared Code
- Both frontend and backend can share utility files (e.g., `utils.ts`, `constants.ts`)
- Code runs in different runtime environments but shares type definitions

## HumanID Dual-Path Architecture

BaseHumanIDPlatform supports two distinct verification paths:

### 1. SBT Path (KYC, Phone, Biometrics)
- **Method**: Uses `sbtFetcher` to retrieve on-chain SBTs
- **Validation**: 
  - Checks publicValues array (minimum 5 elements)
  - Nullifier at index 3
  - Expiry validation using `>` (not `>=`) for consistency
- **Providers**: Extend `BaseHumanIdProvider` for shared validation

### 2. Attestation Path (CleanHands)
- **Method**: Uses `attestationFetcher` for Sign Protocol attestations
- **Validation**: Checks `indexingValue` field exists and is non-empty
- **Implementation**: Standalone provider (doesn't inherit `BaseHumanIdProvider`)
- **Rationale**: Avoids forcing attestations into SBT pattern

### Key Architectural Decisions
- Shared validation logic in `utils.ts` to avoid duplication
- Constants for credential types (no magic strings)
- Record field in VerifiedPayload ignored when `valid=false`
- Clean separation between SBT and attestation patterns

## isEVM Flag Architecture

The `isEVM` flag indicates whether a platform's stamps are eligible for EVM-based auto-verification. It was unified to a **single source of truth** on `PlatformSpec` (in Providers-config.ts).

### Previous Design (Problematic)
- `isEVM` existed in two places: on the Platform class (App-Bindings) for frontend, and on PlatformSpec for backend auto-verification
- This caused sync bugs when one was updated but not the other

### Current Design (Unified)
- **Backend**: `isEVM` lives on `PlatformDetails` (from PlatformSpec in Providers-config.ts)
  - Auto-verification reads it from `PlatformDetails.isEVM`
- **Frontend**: `PlatformProps` carries `isEVM` as a top-level field
  - Populated from `PlatformDetails` via a derivation loop in `platformMap.ts`
  - Components like `GenericPlatform.tsx` read `isEVM` from `PlatformProps`
- **Platform classes** (App-Bindings) no longer carry `isEVM`

### Custom Platform isEVM Inheritance
Custom platforms inherit `isEVM` directly from their base platform via `CUSTOM_PLATFORM_TYPE_INFO`:
```typescript
isEVM: platformDefinitions[platformTypeInfo.basePlatformName]?.PlatformDetails?.isEVM
```
- No way to override at custom platform level (simplifies architecture, prevents misconfiguration)
- NFT-based custom stamps inherit `isEVM: true` from the NFT base platform
- Non-EVM bases (Civic, TrustaLabs, ZKEmail) intentionally excluded from auto-verification

### Platforms WITHOUT isEVM
Some platforms intentionally do NOT have `isEVM` on PlatformSpec because they are not eligible for auto-verification:
- Civic
- TrustaLabs
- ZKEmail

### Key Files
- `platforms/src/types.ts` - Type definitions for PlatformSpec and isEVM
- `app/components/GenericPlatform.tsx` - Frontend consumer of isEVM
- `app/config/platformMap.ts` - Derivation loop populating PlatformProps.isEVM
- `identity/src/autoVerification.ts` - Backend consumer of isEVM

## Custom Platform ID Convention
- Custom platform IDs use `Custom#${platformName}` format (e.g., `Custom#my-nft-stamp`)
- Backend uses `platformName` directly from customization API
- Provider IDs use `{Type}#name#hash` format (e.g., `NFTHolder#name#hash`, `DeveloperList#name#hash`)
- See `architecture/custom_platform_type_system.md` for full details

## Key Files
- `platforms/src/platforms.ts` - Platform registry with internal IDs as keys
- `platforms/src/*/Providers-config.ts` - Platform configurations with display names
- `platforms/src/*/App-Bindings.tsx` - Frontend platform implementations
- `platforms/src/*/Providers/*.ts` - Backend provider implementations
- `platforms/src/HumanID/shared/` - Shared HumanID utilities and base classes
- `platforms/src/CustomGithub/` - DEVEL custom platform type
- `platforms/src/CustomNFT/` - NFT custom platform type
- `embed/src/stamps.ts` - Stamp metadata with display names
- `embed/src/metadata.ts` - Service that needs to resolve platforms

## Best Practices
- Always use Platform IDs for lookups and programmatic access
- Use display names only for user-facing content
- Maintain consistency between platform IDs across all services
- Keep frontend and backend responsibilities clearly separated
- Share validation logic where appropriate to avoid duplication
- For custom platforms: always reference via `Custom#${platformName}` ID, never by display name