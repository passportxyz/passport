---
status: complete
priority: p2
issue_id: "009"
tags: [code-review, security, input-validation]
dependencies: ["008"]
---

# Path Traversal Risk in Condition URL Construction

## Problem Statement

The `conditionName` value is interpolated directly into a URL path without encoding. Since `conditionName` originates from the provider type string (user-supplied in the request payload), an attacker could submit a type like `NFTHolder#../../secret-endpoint#hash` to make the IAM server issue an authenticated GET request (with `SCORER_API_KEY`) to an unintended internal API path.

Pre-existing in CustomGithub too.

## Findings

**Source:** security-sentinel (Finding 5)

At `platforms/src/CustomNFT/Providers/nftHolder.ts:28`:
```typescript
const url = `${nftConditionEndpoint}/${type}%23${conditionName}%23${conditionHash}`;
```

## Proposed Solutions

### Solution A: Use encodeURIComponent (Recommended)
```typescript
const url = `${endpoint}/${encodeURIComponent(`${type}#${conditionName}#${conditionHash}`)}`;
```

Or validate that conditionName/conditionHash contain only alphanumeric characters.

- **Effort:** Small
- **Risk:** None

## Technical Details

### Affected Files
- `platforms/src/CustomNFT/Providers/nftHolder.ts` (line 28)
- `platforms/src/CustomGithub/Providers/github.ts` (line 30) -- same fix

### Acceptance Criteria
- [ ] conditionName and conditionHash are URL-encoded
- [ ] Path traversal sequences are neutralized
