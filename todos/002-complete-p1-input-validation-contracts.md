---
status: complete
priority: p1
issue_id: "002"
tags: [code-review, security, validation]
dependencies: []
---

# Add Input Validation: Address Check + MAX_CONTRACTS Limit

## Problem Statement

The NFTHolderProvider is missing two validations the plan specified:
1. No `isAddress()` check on `payload.address` before constructing ABI calldata (the `.slice(2)` on a non-address string produces garbage)
2. No upper bound on `condition.contracts.length` -- an admin misconfiguration could fire hundreds of parallel RPC calls

Neither is directly user-exploitable (address comes through IAM, contracts come from admin API), but they're defense-in-depth and 5 lines total.

## What to Do

In `platforms/src/CustomNFT/Providers/nftHolder.ts`, add to `verify()`:

```typescript
// After line 47 (const address = payload.address):
const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
if (!address || !ETH_ADDRESS_RE.test(address)) {
  return { valid: false, errors: ["Invalid wallet address"] };
}

// After line 58 (the contracts check):
const MAX_CONTRACTS = 20;
if (condition.contracts.length > MAX_CONTRACTS) {
  return { valid: false, errors: [`Too many contracts: ${condition.contracts.length} exceeds limit of ${MAX_CONTRACTS}`] };
}
```

## Acceptance Criteria
- [ ] Invalid addresses caught before RPC call
- [ ] Conditions with >20 contracts rejected with descriptive error
