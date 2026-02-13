---
status: complete
priority: p1
issue_id: "005"
tags: [code-review, correctness, security]
dependencies: []
---

# Silent Fallback to Mainnet RPC for Unknown Chain IDs

## Problem Statement

When `contract.chainId` is not in the hardcoded RPC URL map, `getRpcUrl` silently falls back to `MAINNET_RPC_URL`. This means a contract on Arbitrum Nova (42170) would be queried on Ethereum mainnet, producing incorrect verification results -- either false negatives (contract doesn't exist on mainnet) or false positives (different contract at same address).

## Findings

**Source:** security-sentinel (Finding 6), architecture-strategist (Finding 3.8), pattern-recognition-specialist (Anti-Pattern 2.4)

At `platforms/src/CustomNFT/Providers/nftHolder.ts:125`:
```typescript
const url = rpcUrls[chainId] || process.env.MAINNET_RPC_URL;
```

## Proposed Solutions

### Solution A: Throw for unsupported chain IDs (Recommended)
```typescript
const url = rpcUrls[chainId];
if (!url) {
  throw new Error(`No RPC URL configured for chainId ${chainId}`);
}
return url;
```

- **Effort:** Small (remove fallback)
- **Risk:** None -- better to fail loudly than silently give wrong results

## Technical Details

### Affected Files
- `platforms/src/CustomNFT/Providers/nftHolder.ts` (line 125)

### Acceptance Criteria
- [ ] Unsupported chainId throws descriptive error
- [ ] Error message includes chainId and supported chains
- [ ] No silent fallback to wrong network
