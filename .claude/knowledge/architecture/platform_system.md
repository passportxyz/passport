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

## HumanID Multi-Source Architecture

BaseHumanIDPlatform supports three verification source types. Platforms compose them:

### 1. SBT Sources (KYC, Phone, Biometrics, ZK Passport)
- **Method**: `sbtFetcher` (single) or `sbtFetchers` (ordered list) — first valid SBT wins
- **Validation**:
  - Checks publicValues array (minimum 5 elements)
  - Nullifier at index 3
  - Expiry validation using `>` (not `>=`) for consistency
- **Providers**: Extend `BaseHumanIdProvider`. Override `sources()` to compose multiple SBT sources (e.g. Government ID accepts regular KYC SBT and ZK Passport SBT).

### 2. On-Chain Attestation Source (CleanHands)
- **Method**: Uses `attestationFetcher` for Sign Protocol attestations
- **Validation**: Checks `indexingValue` field exists and is non-empty

### 3. Off-Chain Attestation Source (Free ZK Passport)
- **Method**: `hasValidOffChainAttestation` on the platform; the provider adds an
  off-chain `CredentialSource` that fetches from id-server directly
  (`getZkPassportFreeOffChainAttestation`).
- **Validation**: Checks `expiresAt > now` and `payload.uniqueIdentifier` is non-empty
- **Stamp expiry**: Sources may return `expiresInSeconds` to clamp the issued VC's
  `expirationDate`. The free ZK Passport attestation has a 7-day TTL — see
  `gotchas/humanid_offchain_attestation_expiry.md`.

### Government ID — multi-source example
`HumanIdKycProvider` (type `HolonymGovIdProvider`) accepts any of three Human ID
issuance paths in this order: (1) regular KYC SBT, (2) paid ZK Passport SBT
(record `sbtType: zk-passport-onchain`), (3) free ZK Passport off-chain
attestation (record `sbtType: zk-passport-offchain`, `expiresInSeconds` clamped
to attestation TTL).

### Iframe option forwarding
`BaseHumanIDPlatform` exposes `kycOptions` / `cleanHandsOptions` fields that are
forwarded to `privateRequestSBT`, controlling which cards appear in the Human ID
iframe chooser. `HumanIdKycPlatform` sets all three KYC flags (`regularKYC`,
`paidZKPassport`, `freeZKPassport`). The `freeZKPassport` flag is stripped from
the public `requestSBT` type but is accepted by the underlying
`privateRequestSBT` — the local `ExtendedHumanIDProvider` cast in
`HumanID/shared/types.ts` re-types it via `KycOptions` from
`@holonym-foundation/human-id-interface-core`.

### Key Architectural Decisions
- Shared validation logic in `utils.ts` to avoid duplication
- Constants for credential types (no magic strings)
- Record field in VerifiedPayload ignored when `valid=false`
- Sources are composable: each is `(address) => Promise<{valid, record, expiresInSeconds?} | {valid:false, error}>`

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