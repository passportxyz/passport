import { wagmiChains, wagmiTransports } from "./chains";
import { initSilkWithEIP6963 } from "./silkEIP6963";
import { setupErrorInterceptor } from "./errorInterceptor";

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { initSilk } from "@silk-wallet/silk-wallet-sdk";

// Setup error interceptor to catch wallet errors before they hit analytics
setupErrorInterceptor();

const projectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string) || "default-project-id";

// Initialize Silk and announce via EIP-6963
// WAGMI will automatically discover it and create an injected connector
if (typeof window !== "undefined") {
  // Add a small delay to ensure DOM is ready
  setTimeout(() => {
    try {
      // Check if Silk is already initialized
      if ((window as any).silk) {
        console.log("Silk wallet already initialized, announcing via EIP-6963");
        initSilkWithEIP6963((window as any).silk);
      } else {
        console.log("Initializing new Silk wallet instance");
        const silk = initSilk({
          config: {
            allowedSocials: ["google", "twitter", "discord", "linkedin", "apple"],
            authenticationMethods: ["email", "phone", "social", "wallet"],
            styles: { darkMode: true },
          },
          walletConnectProjectId: projectId,
          // TODO
          // useStaging: process.env.NEXT_PUBLIC_HUMAN_WALLET_STAGING === "true",
          useStaging: true,
        });

        // Announce via EIP-6963 so WAGMI can discover it
        initSilkWithEIP6963(silk);

        (window as any).silk = silk;
        console.log("Silk wallet initialized and announced via EIP-6963");

        if (silk.on && typeof silk.on === "function") {
          silk.on("error", (error: any) => {
            console.error("Human Wallet provider error:", error);
          });
        }
      }
    } catch (error) {
      console.error("Failed to initialize Silk wallet:", error);
      // Re-throw to ensure error surfaces properly
      throw error;
    }
  }, 100);
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
  // Add Human Wallet as custom wallet so it shows even when not installed
  // NOTE: This will show duplicate when Human Wallet is installed via browser extension
  // AppKit doesn't support deduplication between custom and EIP-6963 wallets
  customWallets: [
    {
      id: "tech.human.wallet",
      name: "Human Wallet",
      homepage: "https://human.technology/wallet",
      image_url:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiByeD0iMjAiIGZpbGw9IiMwMDAwMDAiLz4KPHBhdGggZD0iTTQ4IDI0QzM0Ljc0NTIgMjQgMjQgMzQuNzQ1MiAyNCA0OEM0NCA2MS4yNTQ4IDM0Ljc0NTIgNzIgNDggNzJDNjEuMjU0OCA3MiA3MiA2MS4yNTQ4IDcyIDQ4QzcyIDM0Ljc0NTIgNjEuMjU0OCAyNCA0OCAyNFoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+",
      webapp_link: "https://human.technology/wallet",
      desktop_link: "https://human.technology/wallet",
      mobile_link: "https://human.technology/wallet",
    },
  ],
});
