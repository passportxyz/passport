---
title: "NFT Custom Platform Type - Implementation & Hardening"
date: 2026-02-12
category: feature-implementations
tags:
  - custom-platforms
  - nft-verification
  - on-chain-integration
  - security-hardening
  - code-review
  - architecture-pattern
severity: high
related_issues:
  - "#3868"
components:
  - platforms/src/CustomNFT/
  - app/hooks/usePlatforms.tsx
  - app/config/platformMap.ts
  - identity/src/verification.ts
  - types/src/index.d.ts
---

# NFT Custom Platform Type - Complete Implementation with Security Hardening

## Problem Statement

The passport-scorer backend added a new custom credential type `"NFT"` for NFT ownership verification. Without frontend support, any customization including `platformType: "NFT"` in `customStamps` would crash the app at `usePlatforms.tsx:139` with `throw new Error('Unknown custom platform type: NFT')`. This crash is **not isolated to NFT stamps** -- it blocks ALL stamps from rendering, white-screening the entire platform list.

## Solution Architecture

### 1. CustomNFT Platform Package

Created a new dedicated platform at `platforms/src/CustomNFT/` following the `CustomGithub` pattern:

```
platforms/src/CustomNFT/
├── App-Bindings.ts          # Wallet-only platform (empty getProviderPayload)
├── Providers-config.ts      # PlatformDetails with isEVM: true
├── Providers/
│   ├── index.ts
│   └── nftHolder.ts         # NFTHolderProvider (condition fetch + parallel RPC)
├── __tests__/
│   └── nftHolder.test.ts    # 16 tests, 100% coverage
└── index.ts
```

**Why separate from existing NFT platform:**

| Aspect | Existing NFT | CustomNFT (new) |
|--------|-------------|-----------------|
| Platform ID | `"NFT"` | `"NFTHolder"` |
| Provider IDs | `NFTScore#50` etc. | `NFTHolder#name#hash` |
| Stamps | Static, hardcoded | Dynamic, per-customization |
| Verification | Existing NFT provider | Condition-based with parallel RPC |

### 2. NFTHolderProvider Verification Flow

```
verify(payload)
  1. Validate wallet address (regex /^0x[0-9a-fA-F]{40}$/)
  2. Validate conditionName + conditionHash present
  3. Fetch condition from scorer API (encodeURIComponent on URL)
  4. Validate contracts array (non-empty, <= 20 contracts)
  5. Check all contracts in PARALLEL via Promise.allSettled
     - Each: eth_call balanceOf(address) with 10s timeout
     - OR logic: any balance > 0 = valid
  6. Return { valid, record, errors } with failure count
```

### 3. Frontend Registry

Added `"NFT"` entry to `CUSTOM_PLATFORM_TYPE_INFO` in `app/config/platformMap.ts`:

```typescript
NFT: {
  basePlatformName: "CustomNFT",
  platformClass: CustomNFT.CustomNFTPlatform,
  platformParams: {},
}
```

Each API entry like `customStamps.boredApes = { platformType: "NFT", ... }` becomes a distinct platform card in "Partner Stamps".

### 4. Shared Prefix Handler

Extracted `parseConditionBasedType()` in `identity/src/verification.ts` to handle both `DeveloperList#name#hash` and `NFTHolder#name#hash` with identical parsing logic. Adding future custom types requires only a one-line config change to `CONDITION_BASED_PREFIXES`.

### 5. isEVM Inheritance Chain

```typescript
isEVM: stamp.isEVM ?? platformDefinitions[baseName]?.PlatformDetails?.isEVM ?? false
```

Three-level fallback: API per-stamp value > base platform default > false.

### 6. Deployment Safety Net

Changed `throw new Error` to `console.warn + continue` for unknown `platformType` values. Applied to BOTH `allPlatformDefinitions` and `allPlatformsMap` memos. Enables independent backend/frontend deployment without cascading crashes.

## Code Review Findings & Fixes

Multi-agent review (security-sentinel, julik-frontend-races-reviewer, architecture-strategist, performance-oracle, pattern-recognition-specialist, code-simplicity-reviewer, kieran-typescript-reviewer) caught 7 issues, all fixed:

| # | Finding | Severity | Category | Fix |
|---|---------|----------|----------|-----|
| 001 | Missing platformType guard in allPlatformDefinitions | P1 | Logic | Added matching guard before `basePlatformName` access |
| 002 | No address validation + no MAX_CONTRACTS limit | P1 | Security | Added ETH regex + MAX_CONTRACTS=20 |
| 003 | Missing RPC timeout | P1 | Reliability | Added `{ timeout: 10_000 }` to axios.post |
| 004 | Silent fallback to mainnet for unknown chainId | P1 | Data Integrity | Removed `\|\| MAINNET_RPC_URL`, now throws |
| 005 | Zero unit tests | P1 | Coverage | 16 tests, 100% coverage |
| 006 | Path traversal in condition URL | P2 | Security | `encodeURIComponent()` on URL segments |
| 007 | Missing partnerName in memo deps | P2 | React Hooks | Added to dependency array |

## Plan vs Reality

| Plan Feature | Status | Notes |
|-------------|--------|-------|
| CustomNFT platform package | Done | Followed CustomGithub pattern exactly |
| Parallel RPC with Promise.allSettled | Done | Plan's architecture decision was correct |
| Deployment safety net | Done | Review caught it was only half-applied |
| Shared parseConditionBasedType | Done | Eliminated duplication |
| Condition caching (LRU) | Skipped | Not in acceptance criteria, future optimization |
| isAddress() from ethers | Different | Used equivalent regex (no extra dependency) |
| Token standard validation | Skipped | Requires backend schema extension for ERC-1155 |
| ERC-1155 tokenId support | Skipped | Requires backend changes, separate ticket |

## Lessons Learned

### What the Plan Got Right
1. **Parallel RPC execution** -- sequential would timeout with 3+ contracts
2. **3-phase deployment** -- safety net first prevents cascading crashes
3. **Shared utility extraction** -- parseConditionBasedType eliminates duplication
4. **Platform registry pattern** -- CUSTOM_PLATFORM_TYPE_INFO scales to future types

### What the Plan Missed
1. **Asymmetric guards** -- safety net must be applied to ALL code paths, not just one
2. **Silent fallback antipattern** -- never default to wrong network, fail loud instead
3. **Path traversal** -- URL construction from user-controlled data needs encoding
4. **Memo dependencies** -- all variables read inside useMemo must be in deps array

### Multi-Agent Review Value
Different agents caught orthogonal issues: security-sentinel found path traversal + validation gaps, julik-frontend-races-reviewer found React hook issues, pattern-recognition-specialist flagged missing tests. A single reviewer might have missed 2-3 of these.

## Reusable Checklists

### New Custom Platform Provider Checklist

**Input Validation:**
- [ ] Validate wallet address format before any RPC call
- [ ] Check required payload fields (conditionName, conditionHash)
- [ ] Enforce array size limits (MAX_CONTRACTS)

**External Calls:**
- [ ] Add timeout to ALL axios calls (`{ timeout: 10_000 }`)
- [ ] Throw on missing config (no silent fallbacks)
- [ ] Use `encodeURIComponent()` for URL path segments from external data
- [ ] Track failure counts in Promise.allSettled results

**Frontend Registration:**
- [ ] Add guard in ALL useMemo blocks that access platformTypeInfo
- [ ] Include all read variables in memo dependency arrays
- [ ] Use isEVM fallback chain: `API value ?? base platform ?? false`

**Testing:**
- [ ] Create __tests__/ directory with test file
- [ ] Minimum 11 test cases: success, failure, invalid inputs, timeouts, limits, RPC errors
- [ ] Mock both API (axios.get) and RPC (axios.post) calls
- [ ] Test invalid addresses, missing fields, oversized arrays, unsupported chains

**Deployment:**
1. Deploy safety net only (warn-and-skip for unknown types)
2. Deploy backend with new provider
3. Deploy full frontend with platform registration
4. Admin creates stamps in scorer

### RPC/External Call Checklist

- [ ] Define timeout constant at file top
- [ ] Add `{ timeout }` to every axios call
- [ ] Throw for missing RPC URL (no fallback to wrong network)
- [ ] Use Promise.allSettled for parallel calls (not Promise.all)
- [ ] Report rejection count in error message
- [ ] Use handleProviderAxiosError for API errors

## Key Files

### New Files
- `platforms/src/CustomNFT/App-Bindings.ts` -- Platform class
- `platforms/src/CustomNFT/Providers-config.ts` -- Platform metadata
- `platforms/src/CustomNFT/Providers/nftHolder.ts` -- Provider implementation
- `platforms/src/CustomNFT/__tests__/nftHolder.test.ts` -- Unit tests

### Modified Files
- `platforms/src/platforms.ts` -- Platform registry
- `app/config/platformMap.ts` -- Frontend type info
- `app/hooks/usePlatforms.tsx` -- Safety net + isEVM fallback + memo deps
- `identity/src/verification.ts` -- Shared prefix handler
- `types/src/index.d.ts` -- Provider ID types
- `app/utils/customizationUtils.tsx` -- CustomStamp type

## Cross-References

- Plan: `docs/plans/2026-02-11-feat-nft-custom-platform-type-plan.md`
- Architecture: `.claude/knowledge/architecture/platform_system.md` (isEVM flag, platform identification)
- Error handling: `.claude/knowledge/conventions/error_handling.md` (provider philosophy)
- Testing: `.claude/knowledge/testing/provider_testing.md` (VerifiedPayload patterns)
- Review todos: `todos/001-007-complete-*.md`
