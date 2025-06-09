# Human ID Integration Plan

## Overview

This document outlines the plan for integrating Human ID SDK into Gitcoin Passport as a new stamp provider. Human ID provides phone number verification through privacy-preserving SBTs (Soulbound Tokens).

## Key Differences from Standard Stamps

1. **Frontend-Heavy Flow**: Unlike OAuth providers, the frontend handles SBT minting directly
2. **Wallet Interactions**: Requires signature and transaction handling via wagmi
3. **No OAuth**: No redirect flow or authorization codes
4. **Gas Fees**: Users pay for SBT minting on Optimism
5. **On-Chain Verification**: Backend simply checks SBT ownership

## Implementation Plan

### 1. Package Dependencies

Add to relevant package.json files:
```json
"@holonym-foundation/human-id-sdk": "latest"
```

### 2. Platform Structure

Create the following files in `/platforms/src/HumanID/`:

#### `index.ts`
```typescript
export { HumanIDPlatform } from "./App-Bindings";
export { HumanIDProviderConfig } from "./Providers-config";
export { providers } from "./Providers";
```

#### `App-Bindings.tsx`
- Extend `Platform` class
- Override `getProviderPayload()` to handle the custom flow:
  1. Initialize Human ID SDK
  2. Get keygen message
  3. Request user signature
  4. Call `privateRequestSBT` with payment callback
  5. Return result with transaction details
- Add informative banner explaining the process
- Set `isEVM = true` since it requires wallet connection

#### `Providers-config.ts`
```typescript
export const HumanIDProviderConfig = {
  PlatformDetails: {
    icon: "./assets/humanIdStampIcon.svg", // Need to add this icon
    platform: "HumanID",
    name: "Human ID",
    description: "Verify your phone number privately with Human ID",
  },
  ProviderConfig: [
    {
      title: "Phone Verification",
      description: "Verify your phone number to receive a privacy-preserving SBT",
      providers: [
        {
          title: "Phone SBT",
          description: "Proves you have verified your phone number",
          name: "HumanIdPhone",
        },
      ],
    },
  ],
};
```

#### `Providers/humanIdPhone.ts`
- Implement `Provider` interface
- `verify()` method:
  - Extract address from payload
  - Set Optimism RPC URL
  - Call `getPhoneSBTByAddress(address)`
  - Return valid if SBT exists
  - Include phone SBT details in record

### 3. Frontend Integration Approach

#### Custom Provider Payload Flow
```typescript
async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
  const humanID = initHumanID();
  const msg = humanID.getKeygenMessage();
  
  // This is where it differs - we need access to wagmi hooks
  // Options:
  // 1. Pass signing function via appContext
  // 2. Return special payload that GenericPlatform handles
  // 3. Create custom UI component for HumanID
  
  // Recommended: Return special payload type
  return {
    humanId: {
      action: "requestSignature",
      message: msg,
      sbtType: "phone"
    }
  };
}
```

#### GenericPlatform Adjustments
- Detect HumanID payload type
- Handle signature request using wagmi hooks
- Implement payment callback with transaction handling
- Pass result to backend for verification

### 4. Backend Verification

The backend provider will be simple:
```typescript
async verify(payload: RequestPayload): Promise<VerifiedPayload> {
  const address = payload.address;
  const phoneSbt = await getPhoneSBTByAddress(address);
  
  return {
    valid: !!phoneSbt,
    record: phoneSbt ? {
      hasPhoneSBT: true,
      sbtAddress: phoneSbt.address,
      verifiedAt: phoneSbt.timestamp
    } : undefined,
  };
}
```

### 5. Configuration Updates

#### `/app/config/platformMap.ts`
Add HumanID to the platform map with appropriate metadata.

#### Environment Variables
Add to `.env`:
```
NEXT_PUBLIC_OPTIMISM_RPC_URL=<optimism-rpc-url>
```

### 6. Testing Approach

#### Unit Tests
- Mock Human ID SDK functions
- Test signature flow
- Test SBT verification logic

#### Integration Tests
- Test full flow with mock wallet
- Verify error handling
- Test transaction failures

### 7. User Experience Flow

1. User selects "Human ID" from available stamps
2. Clicks "Connect" on the Phone SBT option
3. Modal explains the process and gas fees
4. User clicks "Start Verification"
5. Wallet prompts for signature
6. Human ID iframe appears for phone verification
7. After verification, wallet prompts for transaction
8. Transaction completes, SBT is minted
9. Backend verifies SBT ownership
10. Stamp is added to passport

### 8. Error Handling

- Signature rejection
- Transaction failure
- Insufficient gas
- Network issues
- Human ID service errors
- SBT already exists

### 9. Security Considerations

- Validate all addresses
- Ensure proper RPC URL configuration
- Handle private keys securely (SDK manages this)
- Verify SBT contract addresses

### 10. Future Enhancements

- Support for KYC SBT
- Caching SBT queries
- Gas estimation display
- Multiple phone number support
- Batch verification

## Implementation Order

1. Create platform file structure
2. Implement backend provider with mocked SBT queries
3. Add basic frontend platform class
4. Integrate Human ID SDK in frontend
5. Handle signature and transaction flow
6. Connect frontend to backend
7. Add tests
8. Update documentation
9. Add UI polish and error handling

## Questions to Resolve

1. Should we cache SBT query results?
2. How to handle users who already have the SBT?
3. Should we support both phone and KYC SBTs?
4. Gas subsidy options?
5. How to handle testnet vs mainnet SBTs?