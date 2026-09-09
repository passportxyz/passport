# HumanID Platforms

KYC / Phone / Biometrics / CleanHands stamps built on Human ID. Shared code in `platforms/src/HumanID/shared/`.

## Credential Sources (composable)

`BaseHumanIDPlatform` (frontend) and `BaseHumanIdProvider` (backend) support three source types; a source is `(address) => Promise<{valid, record, expiresInSeconds?} | {valid: false, error}>`. First valid source wins, in declared order.

1. **SBT** (KYC, Phone, Biometrics, ZK Passport): `sbtFetcher` (single) or `sbtFetchers` (ordered list). Validation: `publicValues` array min 5 elements, nullifier at index 3, expiry checked with `>` (not `>=`).
2. **On-chain attestation** (CleanHands): `attestationFetcher` for Sign Protocol attestations; valid iff `indexingValue` exists and is non-empty.
3. **Off-chain attestation** (free ZK Passport): platform `hasValidOffChainAttestation`; provider adds an off-chain source via `getZkPassportFreeOffChainAttestation` (fetches id-server directly).

Shared validation lives in `platforms/src/HumanID/shared/utils.ts` — used by both App-Bindings and Providers. Credential types are constants, no magic strings. `record` in `VerifiedPayload` is ignored when `valid=false`.

## Government ID — Multi-Source Example

`HumanIdKycProvider` (type `HolonymGovIdProvider`, `platforms/src/HumanIdKyc/Providers/humanIdKyc.ts`) tries in order:

1. regular KYC SBT
2. paid ZK Passport SBT (`sbtType: "zk-passport-onchain"`)
3. free ZK Passport off-chain attestation (`sbtType: "zk-passport-offchain"`)

Order matters: any on-chain SBT short-circuits the off-chain check, so a free→paid upgrade gets a default-lifetime stamp on re-verify.

## Free ZK Passport: 7-Day Expiry Clamp

The free flow mints **no SBT** — id-server stores an off-chain attestation keyed by wallet address, valid 7 days. The stamp's expiry must track the attestation:

- Endpoint: `GET https://id-server.holonym.io/off-chain-attestations/zk-passport?address=…` (200 → `{address, attestationType, payload.uniqueIdentifier, issuedAt, expiresAt}`; 404 = no attestation, handled as `null`; other non-2xx throws)
- id-server returns the most recent record **regardless of expiry** — callers must check `expiresAt > now` (`validateOffChainAttestation`)
- Provider returns `expiresInSeconds = floor((expiresAt - now)/1000)`; `identity/src/verification.ts:237` passes it to `identity/src/credentials.ts`, which clamps the VC `expirationDate`. SBT sources omit it and get the default lifetime.
- Base URL is **hardcoded** (`ID_SERVER_BASE_URL` in `platforms/src/HumanID/shared/utils.ts`) — no env override, no sandbox wiring.

## Iframe Option Forwarding

`BaseHumanIDPlatform` exposes `kycOptions` / `cleanHandsOptions`, forwarded to `privateRequestSBT` to control which cards appear in the Human ID iframe chooser. `HumanIdKycPlatform` sets `regularKYC`, `paidZKPassport`, `freeZKPassport`. `freeZKPassport` is stripped from the public `requestSBT` type but accepted by `privateRequestSBT` — the `ExtendedHumanIDProvider` cast in `HumanID/shared/types.ts` re-types it via `KycOptions` from `@holonym-foundation/human-id-interface-core`.

## CleanHands Is Different

- Sign Protocol attestations, not SBTs (`getCleanHandsSPAttestationByAddress()`, SDK ≥0.0.16)
- Provider is standalone — does **not** extend `BaseHumanIdProvider`; frontend extends `BaseHumanIDPlatform` with `attestationFetcher`
- No try-catch in `verify()` — unexpected errors bubble up (see [providers](../development/providers.md))

## Biometrics

Migrated from direct Holonym API calls to HumanID SBTs (`getBiometricsSBTByAddress()`); provider extends `BaseHumanIdProvider`, tests mock the SDK (not axios).
