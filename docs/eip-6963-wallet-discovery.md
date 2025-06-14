# EIP-6963 Wallet Discovery Implementation Guide

## Overview

EIP-6963 (Multi Injected Provider Discovery) is a standard that allows wallets to announce themselves to dApps without conflicts. Instead of fighting over `window.ethereum`, wallets can coexist peacefully by announcing themselves through a standardized event system.

## Key Concepts

### 1. **Provider Info Structure**
Each wallet must provide:
- `uuid`: A UUIDv4 string uniquely identifying the wallet
- `name`: Human-readable name (e.g., "Human Wallet", "MetaMask")
- `icon`: Base64-encoded icon (minimum 96x96px)
- `rdns`: Reverse Domain Name System identifier (e.g., "tech.human.wallet")

### 2. **Event-Based Discovery**
- Wallets listen for `eip6963:requestProvider` events
- When received, wallets respond with `eip6963:announceProvider` events
- dApps can request all wallets by dispatching the request event

### 3. **RDNS (Reverse Domain Name System)**
Common RDNS identifiers:
- MetaMask: `io.metamask`
- Coinbase Wallet: `com.coinbase.wallet`
- Rainbow: `me.rainbow`
- Human Wallet: `tech.human.wallet`

## Implementation for Human Wallet (Silk)

### Current Setup
The codebase currently initializes Silk wallet in `/app/utils/web3.ts` and creates a custom WAGMI connector in `/app/utils/humanWalletConnector.ts`.

### Enhanced Implementation with EIP-6963
I've created two new files:

1. **`/app/utils/silkEIP6963.ts`** - Implements EIP-6963 announcement for Silk wallet
2. **`/app/utils/eip6963-example.ts`** - Comprehensive examples and documentation

### Key Changes Made:

1. **Updated `/app/utils/web3.ts`**:
   ```typescript
   import { initSilkWithEIP6963 } from "./silkEIP6963";
   
   // Announce via EIP-6963 for better wallet discovery
   initSilkWithEIP6963(silk);
   ```

2. **Created EIP-6963 Announcer**:
   - Announces Human Wallet with proper metadata
   - Listens for provider requests
   - Makes wallet discoverable by dApps

## How It Works

### Wallet Side (Human Wallet)
1. Initialize the wallet provider
2. Create provider info with metadata
3. Listen for `eip6963:requestProvider` events
4. Respond with `eip6963:announceProvider` event containing provider details

### dApp Side (Reown/WalletConnect)
1. Dispatch `eip6963:requestProvider` event
2. Listen for `eip6963:announceProvider` responses
3. Collect and display available wallets
4. Allow users to select and connect

## Benefits

1. **No Conflicts**: Multiple wallets can coexist without fighting over `window.ethereum`
2. **Better UX**: Users see all their installed wallets with proper names and icons
3. **Standardized**: Following an official Ethereum standard (EIP-6963)
4. **Backwards Compatible**: Can still inject into `window.ethereum` for legacy support

## Security Considerations

1. **Icon Sanitization**: SVG icons can contain JavaScript and should be sanitized
2. **Provider Validation**: Verify UUID format and RDNS structure
3. **Info Tampering**: Provider info objects should be frozen to prevent modification

## Testing

To test the implementation:

1. Check browser console for "Silk wallet initialized and announced via EIP-6963"
2. Run this in console to see announced wallets:
   ```javascript
   window.addEventListener("eip6963:announceProvider", (e) => console.log(e.detail));
   window.dispatchEvent(new Event("eip6963:requestProvider"));
   ```
3. Verify Human Wallet appears in the wallet selection modal

## Next Steps

1. **Update Silk SDK**: The actual Silk SDK might need to implement EIP-6963 natively
2. **Icon**: Replace the placeholder icon with the actual Human Wallet logo
3. **UUID**: Generate a proper UUIDv4 for Human Wallet
4. **Testing**: Thoroughly test with various dApps and wallet configurations