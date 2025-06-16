# Human Wallet Integration Guide

## Overview

Human Wallet (formerly Silk Wallet) is integrated into the Passport application using the EIP-6963 standard for multi-injected provider discovery. This allows the wallet to be automatically discovered by WAGMI without requiring custom connectors.

## Implementation Details

### 1. Core Integration Files

#### `/app/utils/web3.ts`
Main web3 configuration that initializes Silk wallet and announces it via EIP-6963:
- Initializes Silk SDK on page load
- Announces wallet using EIP-6963 standard
- WAGMI automatically discovers and creates an injected connector

#### `/app/utils/silkEIP6963.ts`
EIP-6963 implementation for wallet discovery:
- Announces Human Wallet to dApps via standard events
- Uses dynamic UUID generation (`crypto.randomUUID()`) per session
- Listens for provider request events
- Makes wallet discoverable without conflicts

### 2. How It Works

#### EIP-6963 Discovery Flow
1. **Wallet Initialization**: Silk SDK initializes when the app loads
2. **Provider Announcement**: Wallet announces itself via `eip6963:announceProvider` event
3. **Automatic Discovery**: WAGMI's `multiInjectedProviderDiscovery` (enabled by default) discovers the wallet
4. **Connector Creation**: WAGMI automatically creates an injected connector for Human Wallet
5. **User Selection**: Wallet appears in Reown AppKit's wallet selection modal
6. **Connection**: When selected, WAGMI handles the connection using the auto-generated connector

### 3. Configuration

#### Environment Variables
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_HUMAN_WALLET_STAGING=true  # Optional: Use staging environment
```

#### Key Configuration
```typescript
// Initialize Silk and announce via EIP-6963
const silk = initSilk({
  config: {
    allowedSocials: ["google", "twitter", "discord", "linkedin", "apple"],
    authenticationMethods: ["email", "phone", "social", "wallet"],
    styles: { darkMode: true },
  },
  walletConnectProjectId: projectId,
  useStaging: process.env.NEXT_PUBLIC_HUMAN_WALLET_STAGING === "true",
});

// Announce via EIP-6963 so WAGMI can discover it
initSilkWithEIP6963(silk);
```

#### Special Handling for Human Wallet
The integration includes a wrapper that handles Human Wallet's unique authentication flow:
- Intercepts `eth_requestAccounts` calls from WAGMI
- Automatically triggers `login()` when needed
- Supports auto-reconnection for returning users
- Filters out empty addresses to prevent validation errors

### 4. EIP-6963 Provider Info

Human Wallet announces itself with:
- **UUID**: Dynamically generated per session using `crypto.randomUUID()`
- **Name**: "Human Wallet"
- **RDNS**: "tech.human.wallet"
- **Icon**: Base64-encoded SVG logo

### 5. Testing

To verify the integration:

1. **Check Initialization**
   ```javascript
   // In browser console
   window.silk  // Should return the Silk wallet instance
   ```

2. **Verify EIP-6963 Announcement**
   ```javascript
   // Listen for wallet announcements
   window.addEventListener("eip6963:announceProvider", (e) => console.log(e.detail));
   window.dispatchEvent(new Event("eip6963:requestProvider"));
   // Should see Human Wallet in the logged details
   ```

3. **Test Connection**
   - Click "Connect Wallet" button
   - Human Wallet should appear in the wallet list
   - Select it to initiate connection
   - Complete authentication flow

### 6. Benefits of EIP-6963 Approach

1. **No Custom Connectors**: WAGMI handles everything automatically
2. **Standard Compliance**: Following official Ethereum standards
3. **Automatic Discovery**: Works with any dApp that supports EIP-6963
4. **No Conflicts**: Multiple wallets can coexist peacefully
5. **Simpler Code**: Less custom logic to maintain

### 7. Troubleshooting

#### "Not Detected" Error
- Ensure Silk SDK initialization completes before wallet selection
- Check browser console for initialization errors
- Verify EIP-6963 announcement is happening

#### Wallet Doesn't Appear
- Check that `window.silk` exists
- Verify no JavaScript errors during initialization
- Ensure environment variables are set correctly

#### Connection Issues
- Check network compatibility
- Verify WalletConnect project ID is valid
- Review console logs for specific error messages
- Human Wallet provider errors are automatically logged to console via error event listener

#### Empty Address Error
- This was a known issue where Human Wallet returned empty addresses
- Fixed by adding a wrapper that properly handles the login flow
- The wrapper intercepts `eth_requestAccounts` and triggers login when needed

### 8. Security Considerations

- UUID is generated fresh for each session (not hardcoded)
- Provider info objects are frozen to prevent tampering
- Errors are caught and logged without breaking the app
- No sensitive data is exposed in window object

### 9. Future Considerations

- Monitor for native EIP-6963 support in Silk SDK
- Watch for updates to WAGMI's multiInjectedProviderDiscovery
- Consider adding retry logic for initialization failures