---
status: complete
priority: p1
issue_id: "004"
tags: [code-review, security, performance, reliability]
dependencies: []
---

# Missing RPC Call Timeout

## Problem Statement

The `axios.post` call to RPC endpoints in `checkNFTBalance` has no timeout configured. The plan specified a 10-second per-call timeout (line 267, acceptance criteria line 471). A slow or unresponsive RPC node will cause verification to hang indefinitely.

Since `Promise.allSettled` waits for ALL promises, a single hung RPC call blocks the entire verification.

## Findings

**Source:** security-sentinel (Finding 4), performance-oracle (Finding 2.1)

At `platforms/src/CustomNFT/Providers/nftHolder.ts:101-106`:
```typescript
const response = await axios.post(rpcUrl, {
  jsonrpc: "2.0",
  method: "eth_call",
  params: [{ to: contract.address, data }, "latest"],
  id: 1,
});
// No timeout option
```

## Proposed Solutions

### Solution A: Add axios timeout option (Recommended)
```typescript
const RPC_TIMEOUT_MS = 10_000;

const response = await axios.post(rpcUrl, {
  jsonrpc: "2.0",
  method: "eth_call",
  params: [{ to: contract.address, data }, "latest"],
  id: 1,
}, { timeout: RPC_TIMEOUT_MS });
```

- **Effort:** Small (1 line)
- **Risk:** None

## Technical Details

### Affected Files
- `platforms/src/CustomNFT/Providers/nftHolder.ts` (line 101)

### Acceptance Criteria
- [ ] RPC calls timeout after 10 seconds
- [ ] Timed-out calls are reported in error message
- [ ] Verification completes within 30s even with slow RPCs
