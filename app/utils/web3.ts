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
    // Check if Silk is already initialized
    if ((window as any).silk) {
      initSilkWithEIP6963((window as any).silk);
    } else {
      const useStaging = process.env.NEXT_PUBLIC_USE_STAGING === "true";
      const silk = initSilk({
        config: {
          allowedSocials: ["google", "twitter", "discord", "linkedin", "apple"],
          authenticationMethods: ["email", "phone", "social", "wallet"],
          styles: { darkMode: true },
        },
        walletConnectProjectId: projectId,
        // Must set one to true and other to false
        useStaging,
        useProd: !useStaging,
      });

      // Announce via EIP-6963 so WAGMI can discover it
      initSilkWithEIP6963(silk);

      (window as any).silk = silk;

      if (silk.on && typeof silk.on === "function") {
        silk.on("error", (error: any) => {
          console.error("Human Wallet provider error:", error);
        });
      }
    }
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
});
