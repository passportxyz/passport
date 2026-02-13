---
title: "Add NFT Custom Platform Type to Frontend"
type: feat
date: 2026-02-11
---

# feat: Add NFT Custom Platform Type to Frontend

## Enhancement Summary

**Deepened on:** 2026-02-11
**Review agents used:** security-sentinel, kieran-typescript-reviewer, code-simplicity-reviewer, pattern-recognition-specialist, performance-oracle, architecture-strategist, deployment-verification-agent, julik-frontend-races-reviewer, best-practices-researcher, Context7 (wagmi, viem)

### Key Improvements
1. **New `CustomNFT` platform package** — dedicated platform class, not reusing existing NFTPlatform
2. **Parallelize RPC calls** in NFTHolder provider — 10x latency improvement, prevents timeouts
3. **Extract shared prefix handler utility** — eliminates code duplication between DeveloperList and NFTHolder
4. **Add input validation** — contract addresses, chainId, provider ID format, condition array limits
5. **Cache condition definitions** — 95%+ reduction in scorer API calls
6. **3-phase deployment** with safety net deployed first to prevent cascading crashes

---

## Overview

The passport-scorer backend is adding a new custom credential type `"NFT"` for NFT ownership verification. Each entry in `customStamps` with `platformType: "NFT"` becomes its own platform (e.g., `Custom#bayc`, `Custom#coolCats`), and each platform can have one or many stamps via its `credentials` array — just like existing DEVEL custom stamps.

This requires:
1. A new `CustomNFT` platform package (following the `CustomGithub` pattern)
2. Registration in `CUSTOM_PLATFORM_TYPE_INFO` so the frontend knows how to handle `platformType: "NFT"`
3. A backend `NFTHolderProvider` that checks on-chain NFT ownership

## Problem Statement / Motivation

Without the `"NFT"` entry in `CUSTOM_PLATFORM_TYPE_INFO`, the app crashes at `usePlatforms.tsx:139` with `throw new Error('Unknown custom platform type: NFT')` as soon as any customization includes an NFT stamp. This blocks all stamps from rendering — not just NFT stamps.

## Proposed Solution

### Phase 1: New `CustomNFT` Platform Package

**1. Create `platforms/src/CustomNFT/` directory**

Following the exact structure of `CustomGithub` and `AllowList`:

```
platforms/src/CustomNFT/
├── index.ts
├── App-Bindings.ts
├── Providers-config.ts
└── Providers/
    ├── index.ts
    └── nftHolder.ts
```

**2. Create `CustomNFTPlatform` class**
- **File:** `platforms/src/CustomNFT/App-Bindings.ts`
- Wallet-only flow — `getProviderPayload()` returns `{}` (like `AllowListPlatform`)
- No OAuth, no popup, no redirect — verification uses the connected wallet address

```typescript
import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";

export class CustomNFTPlatform extends Platform {
  platformId = "NFTHolder";
  path = "NFTHolder";

  constructor(options: PlatformOptions = {}) {
    super();
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }
}
```

**Why a new class instead of reusing `NFTPlatform`:**
- `NFTPlatform` is the existing static NFT platform with hardcoded banner and `platformId = "NFT"`
- Custom NFT stamps each become their own distinct platform (`Custom#BoredApes`, `Custom#CoolCats`, etc.)
- A dedicated class avoids polluting the static NFT platform and follows the `CustomGithub` vs `Github` pattern
- The `platformId = "NFTHolder"` matches the provider type for IAM routing

**3. Create `Providers-config.ts`**
- **File:** `platforms/src/CustomNFT/Providers-config.ts`

```typescript
import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { NFTHolderProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/nftHolderStampIcon.svg",
  platform: "NFTHolder",
  name: "NFT Holder",
  description: "Verify NFT ownership",
  connectMessage: "Verify",
  isEVM: true,
};

// Empty — custom stamp credentials come dynamically from the API
export const ProviderConfig: PlatformGroupSpec[] = [];

export const providers: Provider[] = [new NFTHolderProvider()];
```

Note: `ProviderConfig` is empty (same as `CustomGithub`). The actual credential list comes from the `customStamps` API response and is built dynamically in `usePlatforms.tsx`.

**4. Create `index.ts` exports**
- **File:** `platforms/src/CustomNFT/index.ts`

```typescript
export { CustomNFTPlatform } from "./App-Bindings.js";
export { PlatformDetails, ProviderConfig, providers } from "./Providers-config.js";
export { NFTHolderProvider } from "./Providers/index.js";
```

**5. Register in `platforms/src/platforms.ts`**

Add `CustomNFT` to the platforms registry alongside `CustomGithub`:

```typescript
import * as CustomNFT from "./CustomNFT/index.js";

// In the platforms object:
CustomNFT: {
  PlatformDetails: CustomNFT.PlatformDetails,
  ProviderConfig: CustomNFT.ProviderConfig,
  providers: CustomNFT.providers,
},
```

### Phase 2: Frontend Registry & Type Safety

**6. Add `NFTHolder#` PROVIDER_ID template literal**
- **File:** `types/src/index.d.ts` (after line 459)
- Add: `` | `NFTHolder#${string}#${string}` ``
- Matches the provider ID format `NFTHolder#BoredApes#f7e3a1b2`

**7. Add `isEVM` to `CustomStamp` type**
- **File:** `app/utils/customizationUtils.tsx:46-64`
- Add optional `isEVM?: boolean` field to the `CustomStamp` type
- The API response includes `isEVM: true` for NFT stamps; the type should reflect this

**8. Register `"NFT"` in `CUSTOM_PLATFORM_TYPE_INFO`**
- **File:** `app/config/platformMap.ts:195`

```typescript
import * as CustomNFT from "@gitcoin/passport-platforms/src/CustomNFT";

export const CUSTOM_PLATFORM_TYPE_INFO: { [id: string]: CustomPlatformTypeInfo } = {
  DEVEL: {
    basePlatformName: "CustomGithub",
    platformClass: CustomGithub.CustomGithubPlatform,
    platformParams: {
      clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
    },
  },
  NFT: {
    basePlatformName: "CustomNFT",
    platformClass: CustomNFT.CustomNFTPlatform,
    platformParams: {},
  },
};
```

- `basePlatformName: "CustomNFT"` — maps to the new platform in `platforms.ts` for fallback PlatformDetails (icon, name, description, `isEVM: true`)
- `platformClass: CustomNFTPlatform` — instantiated per custom stamp entry
- `platformParams: {}` — no OAuth params needed for wallet-only flow

**9. Use API `isEVM` with base-platform fallback**
- **File:** `app/hooks/usePlatforms.tsx:167`
- Change from: `isEVM: platformDefinitions[platformTypeInfo.basePlatformName]?.PlatformDetails?.isEVM`
- Change to: `isEVM: stamp.isEVM ?? platformDefinitions[platformTypeInfo.basePlatformName]?.PlatformDetails?.isEVM ?? false`
- Also update line 114 (`allPlatformDefinitions`) to prefer API value
- The terminal `?? false` ensures `isEVM` is always a boolean, never `undefined`

#### Research Insight: isEVM Override

The backend handoff explicitly states `isEVM` is now dynamic per-stamp. The fallback chain (`API value → base platform → false`) costs one nullish coalescing operator and avoids tech debt when non-EVM custom NFT stamps arrive.

### Phase 3: Deployment Safety (DEPLOY FIRST)

**10. Change `throw` to warn-and-skip for unknown `platformType`**
- **File:** `app/hooks/usePlatforms.tsx:138-139`
- Currently throws, crashing ALL stamps if any single custom stamp has an unrecognized type
- Change to `console.warn(...)` + `continue` to skip unknown types gracefully

```typescript
// Before
if (!platformTypeInfo) throw new Error(`Unknown custom platform type: ${platformType}`);

// After
if (!platformTypeInfo) {
  console.warn(`Unknown custom platform type: ${platformType}, skipping`);
  continue;
}
```

#### Research Insight: Deployment Safety

**Deployment Verification Agent** identified this as CRITICAL infrastructure. Without it, if backend deploys NFT stamps before frontend, ALL users on affected customizations experience React crashes — not just NFT stamps, the entire platform list fails to render.

**Recommended deployment order:**
1. **Phase A — Safety net**: Deploy ONLY the warn-and-skip change. Wait 15 min, verify no crashes.
2. **Phase B — Backend**: Deploy IAM with NFTHolder provider and verifyTypes handler.
3. **Phase C — Full frontend**: Deploy `CustomNFT` platform package + `CUSTOM_PLATFORM_TYPE_INFO["NFT"]`.
4. **Phase D — Admin config**: Create NFT stamps in admin and link to customizations.

Each phase is independently rollbackable.

### Phase 4: IAM Verification Support

**11. Extract shared custom credential prefix handler (refactor first)**
- **File:** `identity/src/verification.ts`
- The DeveloperList and NFTHolder prefix handlers are 100% identical logic except for the prefix name
- Extract a shared utility before adding NFTHolder to avoid duplication

```typescript
const CONDITION_BASED_PREFIXES = ["DeveloperList", "NFTHolder"] as const;

function parseConditionBasedType(
  type: string
): { prefix: string; conditionName: string; conditionHash: string } | null {
  const prefix = CONDITION_BASED_PREFIXES.find((p) => type.startsWith(`${p}#`));
  if (!prefix) return null;

  const parts = type.split("#");
  if (parts.length < 3 || !parts[1] || !parts[2]) {
    throw new Error(`Malformed ${prefix} provider ID: ${type}. Expected: ${prefix}#name#hash`);
  }

  return { prefix, conditionName: parts[1], conditionHash: parts[2] };
}

// Usage in verifyTypes() — replaces both DeveloperList and NFTHolder blocks:
const parsed = parseConditionBasedType(type);
if (parsed) {
  payloadForType.proofs = {
    ...payload.proofs,
    conditionName: parsed.conditionName,
    conditionHash: parsed.conditionHash,
  };
  type = parsed.prefix;
}
```

#### Research Insight: Pattern Duplication

**Pattern Recognition Specialist**: 100% identical logic duplicated is a code smell. The utility:
- Eliminates duplication (DRY)
- Centralizes validation (segment count check)
- Makes adding future custom types a one-line config change
- Do it in two commits: (1) refactor DeveloperList to use utility, (2) add NFTHolder to the array

**12. Create `NFTHolder` provider**
- **File:** `platforms/src/CustomNFT/Providers/nftHolder.ts`
- Fetches credential definition from scorer API (`/internal/customization/credential/{providerId}`)
- Reads `ruleset.condition.contracts` array (OR logic)
- Checks all contracts in **parallel** via `balanceOf`
- Returns `{ valid: true }` if user holds >= 1 token in any listed contract

```typescript
import { isAddress } from "ethers";

const MAX_CONTRACTS = 20;
const RPC_TIMEOUT_MS = 10_000;
const ALLOWED_STANDARDS = ["ERC-721", "ERC-1155"] as const;

export class NFTHolderProvider implements Provider {
  type = "NFTHolder" as const;

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const conditionName = payload.proofs?.conditionName;
    const conditionHash = payload.proofs?.conditionHash;
    const address = payload.address;

    if (!conditionName || typeof conditionName !== "string") {
      return { valid: false, errors: ["Missing conditionName in payload"] };
    }
    if (!conditionHash || typeof conditionHash !== "string") {
      return { valid: false, errors: ["Missing conditionHash in payload"] };
    }
    if (!address || !isAddress(address)) {
      return { valid: false, errors: ["Invalid wallet address"] };
    }

    const condition = await getCondition("NFTHolder", conditionName, conditionHash);

    if (!condition?.contracts?.length) {
      return { valid: false, errors: ["Invalid condition: no contracts defined"] };
    }
    if (condition.contracts.length > MAX_CONTRACTS) {
      return { valid: false, errors: ["Too many contracts in condition"] };
    }

    // Check all contracts IN PARALLEL (OR logic — any match is sufficient)
    const results = await Promise.allSettled(
      condition.contracts.map(async (contract) => {
        if (!isAddress(contract.address)) {
          throw new Error(`Invalid contract address: ${contract.address}`);
        }

        const balance = await Promise.race([
          getBalanceOf(address, contract.address, contract.chainId, contract.standard),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("RPC timeout")), RPC_TIMEOUT_MS)
          ),
        ]);

        return { contract, balance };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const balance = result.value.balance;
        if (typeof balance === "bigint" ? balance > 0n : Number(balance) > 0) {
          return {
            valid: true,
            record: { address, conditionName, conditionHash },
          };
        }
      }
    }

    const failedCount = results.filter((r) => r.status === "rejected").length;
    const errorMsg = failedCount > 0
      ? `No matching NFT holdings found (${failedCount}/${results.length} checks failed)`
      : "No matching NFT holdings found";

    return { valid: false, errors: [errorMsg] };
  }
}
```

#### Research Insights: NFTHolder Provider

**Performance Oracle (CRITICAL)**: Sequential `for` loop will **timeout** with 3+ contracts on slow RPCs. Each RPC call takes 200-500ms average. Parallel execution with `Promise.allSettled` gives 10x improvement.

**Best Practices Research (viem/wagmi)**:
- `balanceOf(address)` for ERC-721 returns count of owned tokens (bigint)
- `balanceOf(address, tokenId)` for ERC-1155 requires token ID — condition schema may need a `tokenId` field
- Flash loans are NOT a risk for view-function `balanceOf` calls

**Error Handling Convention**: Per project conventions, providers should NOT wrap in try-catch at top level. Expected failures return `{ valid: false, errors: [...] }`, unexpected failures bubble up naturally. `Promise.allSettled` contains individual RPC failures.

**13. Add condition caching (shared with DeveloperList)**

```typescript
import LRU from "lru-cache";

const conditionCache = new LRU<string, Condition>({
  max: 500,
  ttl: 1000 * 60 * 60, // 1 hour — conditions are immutable per hash
});

async function getCondition(type: string, conditionName: string, conditionHash: string): Promise<Condition> {
  const cacheKey = `${type}#${conditionName}#${conditionHash}`;
  const cached = conditionCache.get(cacheKey);
  if (cached) return cached;

  const url = `${conditionEndpoint}/${type}%23${conditionName}%23${conditionHash}`;
  const response = await axios.get(url, {
    headers: { Authorization: process.env.SCORER_API_KEY },
  });

  const condition = response.data.ruleset.condition;
  conditionCache.set(cacheKey, condition);
  return condition;
}
```

**Performance Oracle**: Conditions are perfectly cacheable — the `conditionHash` is a content hash. If the condition changes, the hash changes, producing a new provider ID. Expected 95%+ cache hit rate.

## Technical Considerations

### Architecture: CustomNFT vs Existing NFT

The existing `NFT` platform (`platforms/src/NFT/`) handles static NFT ownership stamps (`NFTScore#50`, `NFTScore#75`, etc.) with hardcoded providers. `CustomNFT` is a separate concern:

| Aspect | Existing NFT | CustomNFT (new) |
|--------|-------------|-----------------|
| Platform ID | `"NFT"` | `"NFTHolder"` |
| Provider IDs | `"NFT"`, `"NFTScore#50"` etc. | `"NFTHolder#BoredApes#f7e3a1b2"` |
| Stamps | Static, hardcoded | Dynamic, per-customization |
| Credentials | Fixed set | Admin-configured per partner |
| Banner | Hardcoded "Ethereum Mainnet" | Custom per-stamp from API |
| Category | Blockchain Networks | Partner Stamps |
| Verification | Existing NFT provider logic | New NFTHolderProvider with condition fetch |

Both can coexist — a user might have the static "NFT" stamp AND a custom "Bored Ape Yacht Club" stamp. They serve different purposes.

### How Each Custom Stamp Becomes Its Own Platform

When the API returns:
```json
{
  "customStamps": {
    "boredApes": {
      "platformType": "NFT",
      "displayName": "Bored Ape Yacht Club",
      "iconUrl": "...",
      "credentials": [{ "providerId": "NFTHolder#BoredApes#f7e3a1b2", ... }]
    },
    "coolCats": {
      "platformType": "NFT",
      "displayName": "Cool Cats",
      "iconUrl": "...",
      "credentials": [{ "providerId": "NFTHolder#CoolCats#a9b2c3d4", ... }]
    }
  }
}
```

The system creates:
- `Custom#boredApes` — platform with "Bored Ape Yacht Club" name, custom icon, two credentials (stamps)
- `Custom#coolCats` — platform with "Cool Cats" name, custom icon, one credential

Each appears as a separate card in "Partner Stamps". A platform can have multiple stamps (credentials) — the admin decides how to group them. This is all existing `usePlatforms.tsx` behavior inherited from the DEVEL custom stamp system.

### isEVM Inheritance

Custom platforms inherit `isEVM` from their base platform via `platformDefinitions[basePlatformName].PlatformDetails.isEVM`. Since `CustomNFT.PlatformDetails.isEVM = true`, all NFT custom stamps default to `isEVM: true`. The API can override per-stamp via the `isEVM` field in the response.

### Auto-verification Gap

`autoVerifyStamps()` at `identity/src/autoVerification.ts:40` only checks static platforms. Custom NFT stamps will NOT be auto-verified. This is a known limitation (TODO at line 49). Out of scope for this ticket.

### Banner Handling

`CustomNFTPlatform` has no hardcoded banner (unlike `NFTPlatform`). Custom stamps provide their own banner via the API. The `usePlatforms.tsx:146-151` override code applies the API banner to each platform instance.

### Platform Grouping in `groupProviderTypesByPlatform`

Dynamic `NFTHolder#` provider IDs won't appear in the static `providerTypePlatformMap`. Quick fix — add prefix-based detection:

```typescript
if (!platform) {
  if (type.startsWith("NFTHolder#")) platform = "CustomNFT";
  else if (type.startsWith("DeveloperList#")) platform = "CustomGithub";
  else if (type.startsWith("AllowList#")) platform = "AllowList";
  else platform = "generic";
}
```

Not a blocker, but recommended for operational visibility.

## Acceptance Criteria

### Functional
- [ ] App does not crash when API returns `platformType: "NFT"` in `customStamps`
- [ ] App does not crash when API returns an unrecognized `platformType` (graceful skip)
- [ ] Each NFT custom stamp entry appears as its own platform in "Partner Stamps" category
- [ ] Custom NFT stamps show the API-provided icon, name, description, and banner
- [ ] Multiple NFT platforms can coexist (e.g., `Custom#bayc` + `Custom#coolCats`)
- [ ] A single NFT platform can have multiple stamps (credentials) in its drawer
- [ ] Clicking "Verify" on an NFT stamp sends the correct `NFTHolder#name#hash` provider IDs to IAM
- [ ] IAM parses `NFTHolder#name#hash` and routes to the NFTHolderProvider
- [ ] NFTHolder provider checks `balanceOf` for each contract in the credential definition
- [ ] Verification succeeds if user holds >= 1 token in any listed contract (OR logic)
- [ ] Verification fails with descriptive error if user holds 0 matching NFTs
- [ ] `isEVM` is read from API response, falling back to base platform value, then to `false`
- [ ] Static NFT platform (`NFTScore#50` etc.) is unaffected by this change

### Security & Validation
- [ ] Contract addresses validated with `isAddress()` before RPC calls
- [ ] Contracts array capped at MAX_CONTRACTS (20)
- [ ] Token standard validated against allowlist (`ERC-721`, `ERC-1155`)
- [ ] Provider ID segment count validated (exactly 3 parts)
- [ ] RPC calls have per-call timeout (10s)

### Performance
- [ ] RPC calls parallelized with `Promise.allSettled` (not sequential)
- [ ] Condition definitions cached (LRU, 1-hour TTL)
- [ ] Verification completes within 30 seconds for up to 20 contracts

### Type Safety
- [ ] `NFTHolder#${string}#${string}` is a valid `PROVIDER_ID`
- [ ] `CustomStamp` type includes optional `isEVM` field
- [ ] `isEVM` always resolves to `boolean` (never `undefined`)
- [ ] No TypeScript errors in affected files

### Testing
- [ ] Unit test: `usePlatforms` correctly registers NFT custom stamps as separate platforms
- [ ] Unit test: Multiple NFT custom stamps create distinct platform entries
- [ ] Unit test: `usePlatforms` warns and skips unknown `platformType` (no crash)
- [ ] Unit test: `verifyTypes` parses `NFTHolder#name#hash` and sets correct proofs
- [ ] Unit test: `verifyTypes` rejects malformed `NFTHolder#` IDs (missing segments)
- [ ] Unit test: `NFTHolderProvider` returns valid for address with matching NFT
- [ ] Unit test: `NFTHolderProvider` returns invalid for address without matching NFT
- [ ] Unit test: `NFTHolderProvider` handles multiple contracts in parallel (OR logic)
- [ ] Unit test: `NFTHolderProvider` validates contract addresses
- [ ] Unit test: `NFTHolderProvider` handles RPC timeouts gracefully
- [ ] Unit test: Condition cache returns cached result on second call
- [ ] Unit test: `parseConditionBasedType` utility works for both DeveloperList and NFTHolder

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Backend deploys NFT stamps before frontend is ready | Medium | High — crashes all stamps | Deploy warn-and-skip (Phase 3) FIRST as independent safety net |
| Provider ID format changes | Low | High — verification breaks | Align on format with backend team before implementing |
| `balanceOf` RPC calls fail or timeout | Medium | Medium — verification fails | Parallel execution + per-call timeout + `Promise.allSettled` |
| Admin creates stamp with empty contracts array | Low | Medium — vacuous verification | Provider validates non-empty; backend should also validate on save |
| Admin configures too many contracts (DoS) | Low | Medium — slow verification | MAX_CONTRACTS cap (20); backend admin validation |
| Auto-verification not working for custom NFT stamps | Expected | Low — manual verification still works | Document limitation; address in separate ticket |
| ERC-1155 stamps missing tokenId | Medium | Medium — balance check fails | Validate in provider; document ERC-1155 requirement for backend team |
| `platformId` collision if both NFT and CustomNFT loaded | Low | Low | Different platformIds: `"NFT"` vs `"NFTHolder"` |

## Success Metrics

- Zero crashes from unrecognized `platformType` values
- Partners can configure and display custom NFT stamps without frontend code changes
- Each custom NFT stamp renders as its own distinct platform card
- NFT stamp verification P95 latency < 3 seconds
- NFT stamp verification P99 latency < 5 seconds

## Key Files

### New Files
- `platforms/src/CustomNFT/App-Bindings.ts` — CustomNFTPlatform class
- `platforms/src/CustomNFT/Providers-config.ts` — PlatformDetails with `isEVM: true`
- `platforms/src/CustomNFT/Providers/nftHolder.ts` — NFTHolderProvider
- `platforms/src/CustomNFT/Providers/index.ts` — provider exports
- `platforms/src/CustomNFT/index.ts` — package exports

### Modified Files
- `platforms/src/platforms.ts` — register CustomNFT platform
- `app/config/platformMap.ts:195` — add `"NFT"` to `CUSTOM_PLATFORM_TYPE_INFO`
- `app/hooks/usePlatforms.tsx:139` — throw → warn+skip
- `app/hooks/usePlatforms.tsx:167` — isEVM fallback chain
- `app/utils/customizationUtils.tsx:46` — add `isEVM` to `CustomStamp` type
- `types/src/index.d.ts:459` — add `NFTHolder#` PROVIDER_ID template literal
- `identity/src/verification.ts:117` — extract shared prefix handler + add NFTHolder

### Existing patterns to follow
- `platforms/src/CustomGithub/` — DeveloperList custom platform (same structure)
- `platforms/src/AllowList/` — wallet-only platform (same `getProviderPayload` pattern)
- `platforms/src/CustomGithub/Providers/github.ts` — condition fetching from scorer API

## References

- Backend handoff document (provided in conversation)
- `.claude/knowledge/architecture/platform_system.md` — isEVM flag architecture
- `.claude/knowledge/conventions/error_handling.md` — provider error philosophy
- `.claude/knowledge/testing/provider_testing.md` — VerifiedPayload test patterns
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721) — `balanceOf(address)` returns count of owned tokens
- [ERC-1155 Standard](https://ethereum.org/developers/docs/standards/tokens/erc-1155/) — `balanceOf(address, tokenId)` requires token ID
- [viem readContract docs](https://viem.sh/docs/contract/readContract) — returns `bigint`, compare with `> 0n`
- [wagmi useReadContract docs](https://wagmi.sh/react/api/hooks/useReadContract) — React hook for contract reads
