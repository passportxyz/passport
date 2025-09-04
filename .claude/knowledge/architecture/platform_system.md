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

## Key Files
- `platforms/src/platforms.ts` - Platform registry with internal IDs as keys
- `platforms/src/*/Providers-config.ts` - Platform configurations with display names
- `platforms/src/*/App-Bindings.tsx` - Frontend platform implementations
- `platforms/src/*/Providers/*.ts` - Backend provider implementations
- `platforms/src/HumanID/shared/` - Shared HumanID utilities and base classes
- `embed/src/stamps.ts` - Stamp metadata with display names
- `embed/src/metadata.ts` - Service that needs to resolve platforms

## Best Practices
- Always use Platform IDs for lookups and programmatic access
- Use display names only for user-facing content
- Maintain consistency between platform IDs across all services
- Keep frontend and backend responsibilities clearly separated
- Share validation logic where appropriate to avoid duplication