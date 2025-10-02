# AutoVerification Test Provider Ordering

## Issue Description
The autoVerification tests have a provider ordering mismatch between the test expectations and the actual processing order.

## Root Cause

### Expected Behavior (Test)
Tests expect providers to be processed in the order defined by sets:
- `expectedEvmProvidersToSucceed`
- `expectedEvmProvidersToFail`

### Actual Behavior (Implementation)
`getEvmProvidersByPlatform` returns providers **grouped by platform**:
```
[
  ["ETHDaysActive#50", "ETHGasSpent#0.25", "ETHScore#50", "ETHScore#75", "ETHScore#90"],  // Platform 1
  ["HolonymGovIdProvider", "HolonymPhone"]  // Platform 2
]
```

### Processing Order
Providers are processed in platform groups:
1. All providers from platform 1
2. All providers from platform 2
3. Not mixed between platforms

## Impact
Error mappings in tests may not align with the actual order of provider processing, causing test failures when verifying which providers succeeded or failed.

## Solution
Tests must account for the grouped platform structure when:
- Setting up mock responses
- Verifying error mappings
- Asserting on provider results

## Related Files
- `identity/__tests__/autoVerification.test.ts` - Test file with ordering issue
- `identity/src/autoVerification.ts` - Implementation that groups by platform