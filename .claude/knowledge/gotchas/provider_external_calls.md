# Provider External Call Checklist [2026-02-12]

## Issue Description
When building providers that make external RPC or API calls, several common issues can arise. All four were caught during NFT custom platform code review.

## Checklist

### 1. Always Add Timeout to Axios Calls
```typescript
// GOOD
const response = await axios.post(url, data, { timeout: 10_000 });

// BAD - one hung call blocks Promise.allSettled
const response = await axios.post(url, data);
```

### 2. Always Use encodeURIComponent for User Data in URLs
```typescript
// GOOD
const url = `${endpoint}/credential/${encodeURIComponent(providerId)}`;

// BAD - path traversal risk
const url = `${endpoint}/credential/${providerId}`;
```
This also applied to CustomGithub (pre-existing bug fixed during review).

### 3. Never Silently Fallback to Defaults
```typescript
// GOOD - throw for unknown values
if (!RPC_URLS[chainId]) {
  throw new Error(`Unsupported chainId: ${chainId}`);
}

// BAD - silently using mainnet for unknown chainId
const rpcUrl = RPC_URLS[chainId] || RPC_URLS[1];
```

### 4. Track Rejection Counts in Promise.allSettled
Include rejection count in error messages for debugging:
```typescript
const results = await Promise.allSettled(checks);
const rejected = results.filter(r => r.status === "rejected");
if (rejected.length > 0) {
  errors.push(`${rejected.length} checks failed`);
}
```

## Related Files
- `platforms/src/CustomNFT/Providers/nftHolder.ts` - Where all 4 issues were found
- `platforms/src/CustomGithub/Providers/github.ts` - Pre-existing URL encoding bug
