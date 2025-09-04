# HumanID Platform Patterns

## CleanHands: Sign Protocol Attestations

CleanHands is unique among HumanID-related platforms because it uses Sign Protocol attestations instead of HumanID SBTs:

### Implementation Details
- **Attestation Source**: Uses Sign Protocol attestations
- **SDK Method**: `getCleanHandsSPAttestationByAddress()` (added in v0.0.16)
- **Validation**: Checks `indexingValue` field (must exist and be non-empty)
- **Provider Pattern**: Standalone provider - does NOT inherit from `BaseHumanIdProvider`
- **Frontend Pattern**: Extends `BaseHumanIDPlatform` but uses `attestationFetcher` instead of `sbtFetcher`

### Error Handling
- No try-catch in `verify()` method - errors bubble up for debugging
- This follows the convention of letting unexpected errors throw

## Biometrics: Migration from Holonym to HumanID

The Biometrics platform underwent a complete refactor:

### Previous Implementation
- Direct API calls to Holonym: `https://api.holonym.io/sybil-resistance/biometrics/optimism`
- Custom validation logic
- Direct axios usage in tests

### Current Implementation  
- Uses HumanID SBTs via `getBiometricsSBTByAddress()` (SDK v0.0.16+)
- Provider extends `BaseHumanIdProvider` (inherits all SBT validation)
- Standard validation: expiry, revocation, publicValues array (min 5 elements)

### Testing Changes
- Tests rewritten from mocking axios to mocking SDK functions
- Follows standard HumanID provider test patterns

## Dead Code Removal

### platformName Property
- Was required by `BaseHumanIDPlatform` but never actually used
- Redundant with `platformId`
- Has been removed - only `platformId`, `path`, and `credentialType` are needed

## Shared Validation Pattern

To avoid code duplication between frontend and backend:
- Validation logic lives in `platforms/src/HumanID/shared/utils.ts`
- Both App-Bindings and Providers can import and use these utilities
- Constants for credential types prevent magic strings
- Expiry checks use `>` (not `>=`) for consistency across all platforms