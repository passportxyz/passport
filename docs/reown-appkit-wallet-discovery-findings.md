# Reown AppKit Wallet Discovery Findings

## Overview

This document summarizes findings from investigating why Human Wallet doesn't appear in Reown AppKit's modal when the browser extension isn't installed, despite being announced via EIP-6963.

## Key Findings

### 1. AppKit's Wallet Filtering System

AppKit has a sophisticated filtering system that determines which wallets appear in the modal:

```typescript
// ConnectorUtil.showConnector() in packages/scaffold-ui/src/utils/ConnectorUtil.ts
showConnector(connector: ConnectorWithProviders) {
  const rdns = connector.info?.rdns
  
  // Check if RDNS is excluded
  const isRDNSExcluded = Boolean(rdns) && 
    ApiController.state.excludedWallets.some(
      wallet => Boolean(wallet.rdns) && wallet.rdns === rdns
    )
  
  // Check if name is excluded (case-insensitive)
  const isNameExcluded = Boolean(connector.name) && 
    ApiController.state.excludedWallets.some(wallet =>
      HelpersUtil.isLowerCaseMatch(wallet.name, connector.name)
    )
  
  // For ANNOUNCED (EIP-6963) wallets
  if (connector.type === 'ANNOUNCED' && (isRDNSExcluded || isNameExcluded)) {
    return false
  }
  
  return true
}
```

### 2. Excluded Wallets Management

The excluded wallets list is populated through the API:

```typescript
// ApiController.initializeExcludedWallets()
async initializeExcludedWallets({ ids }: { ids: string[] }) {
  const params = {
    page: 1,
    entries: ids.length,
    include: ids
  }
  const { data } = await ApiController.fetchWallets(params)

  if (data) {
    data.forEach(wallet => {
      state.excludedWallets.push({ rdns: wallet.rdns, name: wallet.name })
    })
  }
}
```

### 3. EIP-6963 Wallet Discovery Process

1. Wallets announce themselves via `eip6963:announceProvider` event
2. AppKit maps these to the 'ANNOUNCED' connector type
3. The wallet must provide valid info:
   - `rdns` (e.g., "tech.human.wallet")
   - `name` (e.g., "Human Wallet")
   - `icon` (base64 data URI)
   - `uuid` (UUIDv4 compliant)

### 4. UPDATE: Human Wallet Works Without Extension!

After properly implementing the EIP-6963 announcement with the wrapped provider, Human Wallet now appears and functions without the browser extension installed. The SDK-initialized provider is fully functional and passes AppKit's validation.

### 5. How It Works

1. **SDK Initialization**: The Silk SDK creates a complete Ethereum provider
2. **EIP-6963 Announcement**: The provider is announced with proper metadata
3. **Provider Wrapper**: Intercepts `eth_requestAccounts` to handle Human Wallet's login flow
4. **AppKit Discovery**: WAGMI/AppKit discovers and validates the provider
5. **Full Functionality**: Users can connect and use Human Wallet without installing the extension

## Solution

No custom wallet configuration is needed! The proper EIP-6963 implementation alone is sufficient:

```typescript
// Initialize Silk SDK
const silk = initSilk({
  config: {
    allowedSocials: ["google", "twitter", "discord", "linkedin", "apple"],
    authenticationMethods: ["email", "phone", "social", "wallet"],
    styles: { darkMode: true },
  },
  walletConnectProjectId: projectId,
  useStaging: true,
});

// Announce via EIP-6963
initSilkWithEIP6963(silk);
```

## Benefits

- **No Extension Required**: Users can use Human Wallet immediately
- **Seamless Experience**: Works just like any other wallet in the modal
- **No Duplicates**: Only one Human Wallet entry appears
- **Full SDK Features**: All authentication methods available (email, social, etc.)

## Debugging Commands

To check if Human Wallet is being excluded:

```javascript
// Check excluded wallets list
ApiController.state.excludedWallets

// Check all connectors
ConnectorController.state.connectors

// Filter for ANNOUNCED type
ConnectorController.state.connectors.filter(c => c.type === 'ANNOUNCED')

// Listen for EIP-6963 announcements
window.addEventListener('eip6963:announceProvider', (e) => console.log('Provider announced:', e.detail))
window.dispatchEvent(new Event('eip6963:requestProvider'))
```