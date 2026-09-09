# Custom Platforms (Runtime Stamps)

Partner-defined stamps created at runtime from the scorer customization API — no code changes per partner.

## CUSTOM_PLATFORM_TYPE_INFO Registry

`app/config/platformMap.ts:196` maps `platformType` strings from the API to base implementations:

- `DEVEL` → `CustomGithub.CustomGithubPlatform`, params: GitHub `clientId`/`redirectUri` from env
- `NFT` → `CustomNFT.CustomNFTPlatform`, params: `{}`

## Data Flow

1. Scorer API returns `customStamps` in the customization response (each stamp: `platformName`, `platformType`, `iconUrl`, `displayName`, `description`, `banner`, `credentials`, optional `isEVM`)
2. `useCustomization` exposes it
3. `app/hooks/usePlatforms.tsx` builds dynamic `PlatformProps`

## ID Conventions

- Custom platform IDs: `Custom#${platformName}` (e.g. `Custom#my-nft-stamp`)
- Condition-based provider IDs: `{Prefix}#name#hash` (e.g. `NFTHolder#x#y`, `DeveloperList#x#y`)
- Backend: `CONDITION_BASED_PREFIXES = ["DeveloperList", "NFTHolder"]` in `identity/src/verification.ts:81`; `parseConditionBasedType` resolves prefixed IDs, and `groupProviderTypesByPlatform` detects them by prefix

## Gotcha: Symmetric Guards in usePlatforms.tsx

Two separate `useMemo` blocks process `customStamps`: `allPlatformDefinitions` (reduce) and `allPlatformsMap` (for loop). Both must guard against unknown `platformType` (`if (!platformTypeInfo) { warn; skip; }`) — both guards exist today; keep them in sync. An asymmetric guard once nearly shipped a runtime crash (`platformTypeInfo.basePlatformName` on undefined).

## CustomNFT (`NFT` type)

`platforms/src/CustomNFT/` — on-chain NFT-holding stamps. Platform ID `NFTHolder` (distinct from the static `NFT` platform at `platforms/src/NFT/`).

- **App-Bindings.ts** (no JSX): wallet-only, `getProviderPayload()` returns `{}`, no OAuth
- **Providers-config.ts**: empty providers array — credentials come dynamically from the API
- **Providers/nftHolder.ts**:
  - Fetches conditions from `${SCORER_ENDPOINT}/internal/customization/credential`
  - Checks ERC-721 `balanceOf` via JSON-RPC `eth_call` (selector `0x70a08231`), with timeout
  - OR logic across contracts — any match passes
  - RPC via Alchemy: `ALCHEMY_CHAIN_SLUGS` map (~19 mainnets: eth, opt, base, arb, polygon, bnb, etc.) + `ALCHEMY_API_KEY`; unknown chainId or missing key **throws** (no silent mainnet fallback)

## Adding a New Custom Platform Type

1. Create the platform package (follow `CustomGithub`/`CustomNFT`)
2. Register in `CUSTOM_PLATFORM_TYPE_INFO`
3. Confirm both `usePlatforms.tsx` memo blocks handle it (guards are generic — usually nothing to add)
4. Add the provider ID template to `types/src/index.d.ts`
5. Condition-based providers: add the prefix to `CONDITION_BASED_PREFIXES` in `identity/src/verification.ts`
