# CustomNFT Platform Architecture

## Overview
CustomNFT platform at `platforms/src/CustomNFT/` enables dynamic NFT-based stamps. Follows the CustomGithub pattern but uses on-chain NFT verification instead of GitHub API.

## Platform Identity
- **Platform ID**: `NFTHolder` (used as platformId, path, platform in PlatformSpec, and provider type prefix)
- **Custom Type Key**: Registered as `"NFT"` in `CUSTOM_PLATFORM_TYPE_INFO`
- **Note**: Distinct from the static `NFT` platform (`platforms/src/NFT/`)

## Package Structure
```
platforms/src/CustomNFT/
├── App-Bindings.ts    # Wallet-only flow (no OAuth), .ts not .tsx (no JSX)
├── Providers-config.ts # Empty ProviderConfig array (credentials come from API)
├── Providers/
│   ├── nftHolder.ts   # NFTHolderProvider implementation
│   └── index.ts       # Provider exports
└── index.ts           # Package exports
```

## Design Decisions

### App-Bindings
- Extends `Platform` directly (not BaseHumanIDPlatform)
- Wallet-only flow: `getProviderPayload()` returns `{}`
- No OAuth needed since verification is on-chain
- `isEVM: true` (requires wallet connection)

### NFTHolderProvider
- Fetches conditions from scorer API: `${SCORER_ENDPOINT}/internal/customization/credential/`
- Checks on-chain NFT `balanceOf` via JSON-RPC `eth_call`
- Uses **OR logic** across contracts (any match is sufficient)
- Provider IDs: `NFTHolder#name#hash` format

### Supported Chains
RPC URLs configured via environment variables for:
- Chain 1: Ethereum mainnet
- Chain 10: Optimism
- Chain 137: Polygon
- Chain 42161: Arbitrum
- Chain 8453: Base

### ProviderConfig
Empty array — custom stamp credentials come dynamically from the customization API, not from static config.

### Icon
Reuses existing `nftStampIcon.svg` from the static NFT platform.

## Key Files
- `platforms/src/CustomNFT/App-Bindings.ts` - Platform class
- `platforms/src/CustomNFT/Providers/nftHolder.ts` - Provider implementation
- `platforms/src/CustomNFT/Providers-config.ts` - Platform spec (empty providers)
- `app/config/platformMap.ts` - Registration in CUSTOM_PLATFORM_TYPE_INFO
