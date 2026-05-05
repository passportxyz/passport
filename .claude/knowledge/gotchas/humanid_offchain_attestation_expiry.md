# Free ZK Passport Off-Chain Attestation: 7-Day Expiry Clamp [2026-04-27]

## Issue Description

Human ID's free ZK Passport flow does **not** mint an SBT. It writes an off-chain
attestation to id-server keyed by wallet address, valid for **7 days from issuance**.
A user with only this attestation has no on-chain credential to fall back on, so the
Government ID stamp's expiry must track the attestation, not Passport's default
credential lifetime.

## Mechanics

- **Endpoint**: `GET https://id-server.holonym.io/off-chain-attestations/zk-passport?address=…`
  (production-only; sandbox lives at `/sandbox/off-chain-attestations/...` and is not
  wired into Passport).
- **Response shape** (200 OK): `{ address, attestationType: "zk-passport", payload: { uniqueIdentifier }, issuedAt, expiresAt }` with ISO timestamps.
- **404** = `NOT_FOUND` is the "no free attestation" signal — handled as `null`, not
  an error. Other non-2xx responses throw.
- id-server returns the **most recent** record regardless of expiry — callers must
  check `expiresAt > now` themselves.

## Stamp expiry plumbing

Provider `verify()` returns `expiresInSeconds = Math.floor((expiresAt - now) / 1000)`
on the off-chain branch. The IAM credential issuer
(`identity/src/credentials.ts`) consumes this via
`identity/src/verification.ts:237` and clamps the issued VC's `expirationDate`
accordingly. SBT-based sources omit `expiresInSeconds` and get the default
credential lifetime.

## Source Order Implications

Government ID provider tries SBT sources before the off-chain attestation. Any
on-chain SBT (regular KYC or paid ZK Passport) short-circuits the off-chain
check. This means a user who upgrades from free → paid ZK Passport gets a
default-lifetime stamp on re-verification, not a 7-day-clamped one.

## URL is hardcoded

The id-server base URL (`https://id-server.holonym.io`) is hardcoded in
`platforms/src/HumanID/shared/utils.ts`. There is no env-var override and no
sandbox wiring. If we ever need staging or sandbox support we must reintroduce
configuration there.

## Related Files

- `platforms/src/HumanID/shared/utils.ts` — `getZkPassportFreeOffChainAttestation`,
  `validateOffChainAttestation`
- `platforms/src/HumanIdKyc/Providers/humanIdKyc.ts` — `zkPassportOffChainSource`
- `platforms/src/HumanIdKyc/App-Bindings.ts` — `hasValidOffChainAttestation`
- `identity/src/credentials.ts`, `identity/src/verification.ts` —
  `expiresInSeconds` → VC `expirationDate` plumbing
