import { wagmiChains, wagmiTransports } from "./chains";
import { initSilkWithEIP6963 } from "./silkEIP6963";

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { initSilk } from "@silk-wallet/silk-wallet-sdk";

const projectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string) || "default-project-id";

// Initialize Silk and announce via EIP-6963
// WAGMI will automatically discover it and create an injected connector
if (typeof window !== "undefined") {
  try {
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

    // Make it available globally for backward compatibility
    (window as any).silk = silk;
    console.log("Silk wallet initialized and announced via EIP-6963");
  } catch (error) {
    console.error("Failed to initialize Silk wallet:", error);
  }
}

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
  // No custom connectors needed - WAGMI will auto-discover EIP-6963 wallets
  // multiInjectedProviderDiscovery is true by default
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
  // No customWallets needed - EIP-6963 wallets are discovered automatically
});
