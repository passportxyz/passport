# Human Wallet Integration with Reown AppKit

This guide provides step-by-step instructions to integrate Human Wallet into your Passport app alongside existing wallets like MetaMask.

## Prerequisites

- Node.js v18.0+
- Existing Reown AppKit setup
- WalletConnect Project ID

## Installation

Install the Human Wallet SDK:

```bash
npm install @silk-wallet/silk-wallet-sdk
```

## Step 1: Create the Human Wallet Connector

Create a new file `app/utils/humanWalletConnector.ts`:

```typescript
import { createConnector } from '@wagmi/core'
import type { CreateConnectorFn } from 'wagmi'
import type { Address } from 'viem'

declare global {
  interface Window {
    silk: any
  }
}

export const humanWalletConnector: CreateConnectorFn = (config) => {
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string

  return createConnector((config) => ({
    id: 'human-wallet',
    name: 'Human Wallet',
    type: 'injected',
    
    async setup() {
      // Initialize Human Wallet SDK if not already initialized
      if (typeof window !== 'undefined' && !window.silk) {
        const { initSilk } = await import('@silk-wallet/silk-wallet-sdk')
        initSilk({
          config: {
            allowedSocials: ['google', 'twitter', 'discord', 'linkedin', 'apple'],
            authenticationMethods: ['email', 'phone', 'social', 'wallet'],
            styles: { darkMode: true }
          },
          walletConnectProjectId: projectId,
          useStaging: false // Set to true for testing
        })
      }
    },
    
    async connect() {
      try {
        // Ensure setup is complete
        await this.setup?.()
        
        // Wait for silk to be available
        let attempts = 0
        while (!window.silk && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
        
        if (!window.silk) {
          throw new Error('Human Wallet not initialized')
        }
        
        // Open login modal
        await window.silk.login()
        
        // Get accounts and chain
        const accounts = await window.silk.request({ method: 'eth_requestAccounts' })
        const chainId = await window.silk.request({ method: 'eth_chainId' })
        
        return { 
          accounts: accounts as Address[], 
          chainId: parseInt(chainId, 16) 
        }
      } catch (error) {
        console.error('Human Wallet connection error:', error)
        throw error
      }
    },
    
    async disconnect() {
      if (window.silk?.logout) {
        await window.silk.logout()
      }
    },
    
    async getAccounts() {
      if (!window.silk) return []
      try {
        const accounts = await window.silk.request({ method: 'eth_accounts' })
        return accounts as Address[]
      } catch {
        return []
      }
    },
    
    async getChainId() {
      if (!window.silk) return config.chains[0].id
      try {
        const chainId = await window.silk.request({ method: 'eth_chainId' })
        return parseInt(chainId, 16)
      } catch {
        return config.chains[0].id
      }
    },
    
    async getProvider() {
      if (!window.silk) {
        throw new Error('Human Wallet not available')
      }
      return window.silk
    },
    
    async isAuthorized() {
      if (!window.silk) return false
      try {
        const accounts = await window.silk.request({ method: 'eth_accounts' })
        return accounts.length > 0
      } catch {
        return false
      }
    },
    
    async switchChain({ chainId }) {
      if (!window.silk) throw new Error('Human Wallet not available')
      
      const hexChainId = `0x${chainId.toString(16)}`
      
      try {
        await window.silk.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hexChainId }],
        })
        
        return config.chains.find((x) => x.id === chainId) ?? config.chains[0]
      } catch (error: any) {
        // Chain not added yet
        if (error.code === 4902) {
          const chain = config.chains.find((x) => x.id === chainId)
          if (!chain) throw new Error('Chain not configured')
          
          await window.silk.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              rpcUrls: [chain.rpcUrls.default.http[0]],
              blockExplorerUrls: [chain.blockExplorers?.default.url],
            }],
          })
          
          return chain
        }
        
        throw error
      }
    },
    
    onAccountsChanged(accounts) {
      if (!window.silk?.on) return () => {}
      
      const handler = (newAccounts: string[]) => {
        accounts(newAccounts as Address[])
      }
      
      window.silk.on('accountsChanged', handler)
      return () => {
        window.silk.removeListener?.('accountsChanged', handler)
      }
    },
    
    onChainChanged(chain) {
      if (!window.silk?.on) return () => {}
      
      const handler = (chainId: string) => {
        chain({ chainId: parseInt(chainId, 16) })
      }
      
      window.silk.on('chainChanged', handler)
      return () => {
        window.silk.removeListener?.('chainChanged', handler)
      }
    },
    
    onDisconnect(disconnect) {
      if (!window.silk?.on) return () => {}
      
      const handler = () => {
        disconnect()
      }
      
      window.silk.on('disconnect', handler)
      return () => {
        window.silk.removeListener?.('disconnect', handler)
      }
    }
  }))
}
```

## Step 2: Update Web3 Configuration

Update your `app/utils/web3.ts` file:

```typescript
import { wagmiChains, wagmiTransports } from "./chains";
import { humanWalletConnector } from "./humanWalletConnector"; // Add this import

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

const projectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string) || "default-project-id";

const metadata = {
  name: "Passport",
  description: "Decentralized Identity Verification",
  url: "https://app.passport.xyz",
  icons: ["/assets/onboarding.svg"],
};

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: wagmiChains,
  transports: wagmiTransports,
  connectors: [humanWalletConnector], // Add Human Wallet connector
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

export const web3Modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: wagmiChains,
  defaultNetwork: wagmiChains[0],
  metadata: metadata,
  features: {
    email: false,
    socials: [],
    emailShowWallets: false,
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-font-family": "var(--font-body)",
    "--w3m-accent": "rgb(var(--color-foreground-4))",
  },
  // Add Human Wallet to the UI
  customWallets: [{
    id: "human-wallet",
    name: "Human Wallet",
    homepage: "https://wallet.human.tech",
    image_url: "https://docs.wallet.human.tech/img/human-logo.svg",
    webapp_link: "https://app.wallet.human.tech"
  }],
  // Optional: Feature Human Wallet prominently
  featuredWalletIds: [
    "human-wallet",
    "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369", // Rainbow
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
  ],
  // Optional: Customize the Human Wallet icon
  connectorImages: {
    'human-wallet': "https://docs.wallet.human.tech/img/human-logo.svg"
  }
});
```

## Step 3: Test the Integration

1. Run your development server:
   ```bash
   npm run dev
   ```

2. Click the connect wallet button in your app

3. You should see "Human Wallet" in the wallet selection modal alongside MetaMask and other wallets

4. Clicking "Human Wallet" should open the Human Wallet login modal with options for:
   - Email/Phone authentication
   - Social logins (Google, Twitter, Discord, etc.)
   - External wallet connection

## Features Available

Once connected, users can:
- Sign messages
- Send transactions
- Switch between chains
- Access all standard Web3 functionality
- Use Human Wallet's gas-free transactions (if configured in Human Portal)

## Troubleshooting

### Human Wallet not appearing in modal
- Ensure the SDK is installed correctly
- Check that the connector is added to the `connectors` array
- Verify `customWallets` configuration is present

### Connection fails
- Check browser console for errors
- Ensure `window.silk` is initialized before attempting connection
- Verify the WalletConnect project ID is valid

### SDK initialization issues
- Make sure you're using Node.js v18.0+
- Try setting `useStaging: true` for testing
- Check that all required ethers.js peer dependencies are installed

## Additional Configuration

### Customize Authentication Methods
Modify the `allowedSocials` and `authenticationMethods` in the connector:

```typescript
initSilk({
  config: {
    allowedSocials: ['google', 'twitter'], // Limit social options
    authenticationMethods: ['email', 'social'], // Remove phone auth
    styles: { darkMode: true }
  }
})
```

### Environment-Specific Settings
Use environment variables for staging/production:

```typescript
const useStaging = process.env.NEXT_PUBLIC_HUMAN_WALLET_STAGING === 'true'

initSilk({
  useStaging,
  // ... other config
})
```

## Support

- Human Wallet Docs: https://docs.wallet.human.tech
- Developer Discord: https://discord.gg/q9PzvWgajH
- Reown AppKit Docs: https://docs.reown.com/appkit/react

## Next Steps

1. Test all wallet connection flows
2. Implement error handling for edge cases
3. Add Human Wallet specific features (email retrieval, SBT minting)
4. Configure gas tank settings in Human Portal for gas-free transactions