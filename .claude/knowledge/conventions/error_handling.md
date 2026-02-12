# Error Handling Conventions

## Provider Error Philosophy

Providers follow a specific error handling philosophy to maximize debuggability:

### Key Principles

1. **NO try-catch at top level of verify() methods**
   - Let errors bubble up naturally
   - Makes debugging easier
   - Ensures unexpected failures are noticed

2. **Expected vs Unexpected Failures**
   - **Expected failures**: Return `{ valid: false, errors: [...] }`
   - **Unexpected failures**: Let them throw (network issues, SDK failures)

3. **Higher-level Error Handling**
   - Frontend/backend separation means backend verify() errors are caught at a higher level
   - The IAM service handles provider errors appropriately

### Example Pattern

```typescript
// GOOD - Let unexpected errors bubble up
async verify(payload: RequestPayload): Promise<VerifiedPayload> {
  const attestation = await sdk.getAttestation(address);
  
  if (!attestation.indexingValue) {
    return { valid: false, errors: ["Missing indexingValue"] };
  }
  
  return { valid: true, record: { ... } };
}

// BAD - Swallowing errors makes debugging hard
async verify(payload: RequestPayload): Promise<VerifiedPayload> {
  try {
    const attestation = await sdk.getAttestation(address);
    // ...
  } catch (e) {
    return { valid: false, errors: ["Something went wrong"] };
  }
}
```

## Files Following This Pattern
- `platforms/src/CleanHands/Providers/index.ts`
- `platforms/src/HumanID/shared/BaseHumanIdProvider.ts`
- `platforms/src/CustomNFT/Providers/nftHolder.ts`
- All providers extending `BaseHumanIdProvider`

## External Call Safety
For providers making external RPC or API calls, see `gotchas/provider_external_calls.md` for the required checklist: timeouts, URL encoding, no silent fallbacks, and rejection tracking.