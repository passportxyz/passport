# Platform System

How platforms are identified, split between frontend/backend, and flagged for auto-verification.

## Platform Identifiers

Each platform has two names — never mix them up:

- **Platform ID** (canonical, for lookups): object keys in `platforms/src/platforms.ts` and the `platform` field in `Providers-config.ts`. Examples: `HumanIdKyc`, `HumanIdPhone`, `CleanHands`, `Github`, `Linkedin`.
- **Display name** (UI only): the `name` field in `Providers-config.ts`. Examples: "Government ID", "Phone Verification", "GitHub".

Lookups by display name have caused real bugs (embed metadata lookups failed for every platform whose display name differed from its ID — since fixed to use `platformId` in `embed/src/metadata.ts`). Always key on Platform IDs.

## Frontend/Backend Split (within platforms/)

Both halves live in the same package per platform:

- **Frontend**: `platforms/src/{Platform}/App-Bindings.tsx|ts` — extends `Platform`, implements `getProviderPayload()` (OAuth URLs, wallet flows, UI orchestration).
- **Backend**: `platforms/src/{Platform}/Providers/*.ts` — implements `Provider.verify()` (API calls, on-chain checks, returns `VerifiedPayload`).
- Shared `utils.ts`/`constants.ts` are fine; the halves run in different runtimes but share types.

## isEVM Flag — Single Source of Truth

`isEVM` marks a platform's stamps as eligible for EVM auto-verification. It lives **only** on `PlatformSpec` in `Providers-config.ts` (`platforms/src/types.ts:14`). It used to also live on Platform classes, which caused sync bugs — don't reintroduce it there.

- Backend consumer: `identity/src/autoVerification.ts` filters on `PlatformDetails.isEVM`.
- Frontend: a derivation loop in `app/config/platformMap.ts` (~line 244) copies `PlatformDetails.isEVM` onto `PlatformProps`; components like `app/components/GenericPlatform.tsx` read it from there.
- Custom stamps: the customization API may set `isEVM` per stamp; falls back to the base platform's value (`isEVM ?? basePlatformSpecs.isEVM` in `app/hooks/usePlatforms.tsx`).
- Civic, TrustaLabs, ZKEmail intentionally have no `isEVM` — excluded from auto-verification.

## Key Files

- `platforms/src/platforms.ts` — platform registry (IDs as keys)
- `platforms/src/*/Providers-config.ts` — PlatformSpec incl. display name, isEVM
- `app/config/platformMap.ts` — frontend platform map + isEVM derivation
- `identity/src/autoVerification.ts` — auto-verification consumer
- `embed/src/stamps.ts`, `embed/src/metadata.ts` — embed-side metadata
