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
- Sets up error interceptor for debugging wallet errors
- Checks if Silk is already initialized before creating new instance

#### `/app/utils/silkEIP6963.ts`
EIP-6963 implementation for wallet discovery:
- Announces Human Wallet to dApps via standard events
- Uses dynamic UUID generation (`crypto.randomUUID()`) per session
- Listens for provider request events
- Makes wallet discoverable without conflicts
- Includes wrapped provider that handles Human Wallet's unique authentication flow

#### `/app/utils/errorInterceptor.ts`
Error handling for wallet connection issues:
- Intercepts error tracking messages before analytics
- Logs wallet connection errors to console
- Helps debug CORS and address validation issues
- Catches unhandled promise rejections related to wallet addresses

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
NEXT_PUBLIC_HUMAN_WALLET_PROD=true  # Optional: Use production environment (defaults to staging)
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
  useStaging: process.env.NEXT_PUBLIC_HUMAN_WALLET_PROD !== "true",
});

// Announce via EIP-6963 so WAGMI can discover it
initSilkWithEIP6963(silk);

// Store reference and add error listener
(window as any).silk = silk;
if (silk.on && typeof silk.on === "function") {
  silk.on("error", (error: any) => {
    console.error("Human Wallet provider error:", error);
  });
}
```

#### Special Handling for Human Wallet
The integration includes a wrapper (`createWrappedSilkProvider` in `silkEIP6963.ts`) that handles Human Wallet's unique authentication flow:
- Intercepts `eth_requestAccounts` calls from WAGMI
- Automatically triggers `login()` when needed
- Supports auto-reconnection for returning users
- Falls back to login if eth_requestAccounts fails with authorization errors
- Logs detailed connection flow for debugging

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

### 7. Important Discovery

**Human Wallet works without the browser extension!** The SDK initialization combined with proper EIP-6963 announcement creates a fully functional embedded wallet that:
- Appears in Reown AppKit's wallet selection modal
- Allows users to connect and authenticate
- Works seamlessly without requiring browser extension installation

This means users have two options:
1. **Browser Extension**: Traditional wallet experience
2. **Embedded SDK**: No installation required, works directly in the web app

### 8. Troubleshooting

#### "Not Detected" Error
- Ensure Silk SDK initialization completes before wallet selection
- Check browser console for initialization errors
- Verify EIP-6963 announcement is happening

#### Wallet Doesn't Appear
- Check that `window.silk` exists
- Verify no JavaScript errors during initialization
- Ensure environment variables are set correctly
- Run `window.silk` in console to verify SDK initialization

#### Connection Issues
- Check network compatibility
- Verify WalletConnect project ID is valid
- Review console logs for specific error messages
- Human Wallet provider errors are automatically logged to console via error event listener

#### Empty Address Error
- This was a known issue where Human Wallet returned empty addresses
- Fixed by adding a wrapper that properly handles the login flow
- The wrapper intercepts `eth_requestAccounts` and triggers login when needed

### 9. Security Considerations

- UUID is generated fresh for each session (not hardcoded)
- Provider info objects are frozen to prevent tampering
- Errors are caught and logged without breaking the app
- No sensitive data is exposed in window object
- Error interceptor prevents sensitive wallet errors from being sent to external analytics

### 10. Future Considerations

- Monitor for native EIP-6963 support in Silk SDK
- Watch for updates to WAGMI's multiInjectedProviderDiscovery
- Consider adding retry logic for initialization failures