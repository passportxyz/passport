# Custom Account Widget Implementation Plan

## Overview
Replace the default Reown AppKit `<w3m-button>` with a custom account widget that matches our design specifications while maintaining all underlying functionality.

## Design Requirements
Based on the provided design (`example-account-center.png`), the widget should display:

1. **Container**: White rounded rectangle with subtle shadow
2. **Wallet Icon**: MetaMask fox icon (or appropriate wallet icon)
3. **Chain Icon**: Ethereum diamond icon (or appropriate chain icon)
4. **Address Display**: Formatted as `0x772B...932` (first 6 and last 3 characters)
5. **Dropdown Arrow**: Gray chevron (visual only, not functional)

## Implementation Status

### ✅ Completed
1. Created `CustomAccountWidget.tsx` component
2. Integrated with AccountCenter.tsx
3. Implemented wallet icon using `connector.icon` from wagmi (EIP-6963 support)
4. Implemented chain icon using existing chains configuration
5. Added address formatting
6. Added disconnect state handling
7. Styled with Tailwind CSS classes

## Technical Implementation

### 1. Create Custom Component
Create `CustomAccountWidget.tsx` that will replace the current `<w3m-button>`:

```tsx
import React from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export const CustomAccountWidget = () => {
  const { address, connector } = useAccount();
  const chainId = useChainId();
  const { open } = useAppKit();

  // Format address: 0x1234...5678
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-3)}`;
  };

  // Get chain icon (we'll need to map chainId to icon URLs)
  const getChainIcon = (chainId: number) => {
    // Implementation details below
  };

  // Get wallet icon (from connector metadata)
  const getWalletIcon = () => {
    // Implementation details below
  };

  return (
    <button
      onClick={() => open()}
      className="custom-account-widget"
    >
      {/* Widget content */}
    </button>
  );
};
```

### 2. Wallet Icon Strategy

**✅ Implemented: Using connector metadata**
```tsx
// The connector object from wagmi's useAccount hook includes icon property
// This is automatically populated by EIP-6963 wallets like Human Wallet
const { connector } = useAccount();

// In the component:
{connector?.icon && (
  <img 
    src={connector.icon} 
    alt={connector.name || "Wallet"} 
    className="w-6 h-6 rounded-md"
  />
)}
```

### 3. Chain Icon Implementation

```tsx
const chainIcons = {
  1: '/assets/eth-logo.svg',           // Mainnet
  10: '/assets/optimism-logo.svg',     // Optimism
  137: '/assets/polygon-logo.svg',     // Polygon
  42161: '/assets/arbitrum-logo.svg',  // Arbitrum
  8453: '/assets/base-logo.svg',       // Base
  // Add all supported chains from chains.ts
};

const getChainIcon = (chainId: number) => {
  return chainIcons[chainId] || '/assets/eth-logo.svg';
};
```

### 4. Styling
```css
.custom-account-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.custom-account-widget:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.wallet-icon, .chain-icon {
  width: 24px;
  height: 24px;
}

.address {
  font-family: monospace;
  font-size: 14px;
  color: #333;
}

.dropdown-arrow {
  color: #999;
  margin-left: 4px;
}
```

### 5. Integration Steps

1. **Update AccountCenter.tsx**:
   ```tsx
   import { CustomAccountWidget } from './CustomAccountWidget';
   
   export const AccountCenter = () => {
     const { verificationComplete } = useOneClickVerification();
     
     return (
       <div className={`rounded-2xl w-fit h-fit bg-background flex justify-end ${verificationComplete ? "right-14 md:right-20 lg:right-36" : "right-2 md:right-10 lg:right-20"}`}>
         <CustomAccountWidget />
       </div>
     );
   };
   ```

2. **Handle disconnected state**:
   ```tsx
   const { isConnected } = useAccount();
   
   if (!isConnected) {
     return (
       <button onClick={() => open()} className="connect-button">
         Connect Wallet
       </button>
     );
   }
   ```

### 6. Testing Setup

Create a minimal test environment for rapid iteration:

1. **test-widget.html**:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
     <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
     <style>
       /* Include widget styles */
     </style>
   </head>
   <body>
     <div id="root"></div>
     <script>
       // Mount test component
     </script>
   </body>
   </html>
   ```

2. **Puppeteer test script**:
   ```js
   const puppeteer = require('puppeteer');
   
   (async () => {
     const browser = await puppeteer.launch({ headless: false });
     const page = await browser.newPage();
     await page.goto('file:///path/to/test-widget.html');
     // Visual testing
   })();
   ```

### 7. Assets Required

Need to add these icon files to `/public/assets/`:
- MetaMask fox icon
- Chain icons for all supported networks
- Default wallet icon
- Chevron down arrow icon

### 8. Considerations

1. **ENS Support**: Add ENS resolution using wagmi's `useEnsName` hook
2. **Loading States**: Show skeleton while fetching wallet/chain data
3. **Error Handling**: Gracefully handle missing icons or connection errors
4. **Responsive Design**: Ensure widget works on mobile devices
5. **Accessibility**: Add proper ARIA labels and keyboard navigation

### 9. Migration Path

1. ✅ Create `CustomAccountWidget` component
2. ✅ Replace `<w3m-button>` in `AccountCenter.tsx`
3. ✅ Verify modal opening functionality still works
4. 🔄 Test with different wallets and chains
5. 🔄 Test all edge cases (disconnected, switching chains, etc.)

## Implementation Summary

### What's Done:
1. **CustomAccountWidget.tsx** created with:
   - Wallet icon from `connector.icon` (EIP-6963 support)
   - Chain icon from existing chains configuration
   - Address formatting (0x1234...567)
   - ENS name support (only on mainnet)
   - Loading states (Connecting...)
   - Disconnected state (Connect Wallet button)
   - Click handler to open AppKit modal

2. **Visual Testing Setup**:
   - `test-widget.html` - Visual reference implementation
   - `test-widget-puppeteer.js` - Automated visual testing script

3. **Integration**:
   - Replaced `<w3m-button>` in AccountCenter.tsx
   - Maintains all existing functionality

### To Run Tests:
```bash
# Visual test with Puppeteer
cd app/
node test-widget-puppeteer.js

# Or open test-widget.html directly in browser
```

### Next Steps:
1. Test with actual app running (`npm start`)
2. Verify with different wallets (MetaMask, Human Wallet, etc.)
3. Test chain switching functionality
4. Add proper error handling for failed icon loads
5. Consider adding tooltip with full address on hover