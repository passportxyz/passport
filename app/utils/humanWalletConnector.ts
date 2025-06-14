import { ChainNotConfiguredError, createConnector } from "wagmi";
import { getAddress, SwitchChainError, UserRejectedRequestError } from "viem";

import { type CredentialType, SILK_METHOD } from "@silk-wallet/silk-interface-core";
import { type SilkEthereumProviderInterface, initSilk } from "@silk-wallet/silk-wallet-sdk";
import type { InitSilkOptions } from "@silk-wallet/silk-wallet-sdk/dist/lib/provider/types";

/**
 * Creates a WAGMI connector for the Silk Wallet SDK
 * @param options the initialization options passed to the Silk Wallet SDK
 * @returns
 */
export default function silk(options?: InitSilkOptions) {
  let silkProvider: SilkEthereumProviderInterface | null = null;

  return createConnector<SilkEthereumProviderInterface>((config) => {
    console.log("Silk Connector Config:", config);
    return {
      id: "silk",
      name: "Human Wallet",
      type: "injected",
      rdns: "tech.human.wallet",
      icon: "https://docs.wallet.human.tech/img/human-logo.svg",
      chains: config.chains,
      supportsSimulation: false,

      async connect({ chainId } = {}) {
        try {
          config.emitter.emit("message", {
            type: "connecting",
          });
          const provider = await this.getProvider();

          provider.on("accountsChanged", this.onAccountsChanged);
          provider.on("chainChanged", this.onChainChanged);
          provider.on("disconnect", this.onDisconnect);

          // Check if already connected or connecting
          const existingAccounts = await this.getAccounts().catch(() => []);
          if (existingAccounts.length === 0 && !provider.connected) {
            try {
              await provider.login();
            } catch (error: any) {
              console.warn("Unable to login", error);
              // Check for specific error types
              if (error?.message?.includes("previous request") || error?.code === -32002) {
                throw new UserRejectedRequestError("Connection already pending. Please check your wallet." as unknown as Error);
              }
              throw new UserRejectedRequestError("User rejected login or login failed" as unknown as Error);
            }
          }

          let currentChainId = await this.getChainId();
          if (chainId && currentChainId !== chainId) {
            console.info(`Switching chain from ${currentChainId} to ${chainId}`);
            // biome-ignore lint/style/noNonNullAssertion: the switchChain method is defined in the connector
            const chain = await this.switchChain!({ chainId }).catch((error) => {
              if (error.code === UserRejectedRequestError.code) throw error;
              return { id: currentChainId };
            });
            currentChainId = chain?.id ?? currentChainId;
          }

          const accounts = await this.getAccounts();

          return { accounts, chainId: currentChainId };
        } catch (error) {
          console.error("Error while connecting", error);
          this.onDisconnect();
          throw error;
        }
      },

      async getAccounts() {
        const provider = await this.getProvider();
        const accounts = await provider.request({
          method: SILK_METHOD.eth_accounts,
        });

        if (accounts && Array.isArray(accounts)) return accounts.map((x: string) => getAddress(x));
        return [];
      },

      async getChainId() {
        const provider = await this.getProvider();
        const chainId = await provider.request({ method: SILK_METHOD.eth_chainId });
        return Number(chainId);
      },

      async getProvider(): Promise<SilkEthereumProviderInterface> {
        if (!silkProvider) {
          if ((window as any).silk) {
            console.log("Using existing Silk provider from window.silk");
            silkProvider = (window as any).silk as SilkEthereumProviderInterface;
          } else {
            console.log("Creating new Silk provider instance");
            console.log("Initializing Silk Provider with options:", options);
            silkProvider = initSilk(options ?? {});
          }
        }
        
        // Log provider state for debugging
        console.log("Silk provider state:", {
          connected: silkProvider.connected,
          isConnecting: (silkProvider as any).isConnecting,
          accounts: await silkProvider.request({ method: SILK_METHOD.eth_accounts }).catch(() => []),
        });

        return silkProvider;
      },

      async isAuthorized() {
        try {
          const accounts = await this.getAccounts();
          return !!accounts.length;
        } catch {
          return false;
        }
      },

      async switchChain({ chainId }) {
        console.info("Switching chain to ID", chainId);
        try {
          const chain = config.chains.find((x) => x.id === chainId);
          if (!chain) throw new ChainNotConfiguredError();

          const provider = await this.getProvider();
          await provider.request({
            method: SILK_METHOD.wallet_switchEthereumChain,
            params: [{ chainId: `0x${chain.id.toString(16)}` }],
          });
          config.emitter.emit("change", { chainId });
          return chain;
        } catch (error: unknown) {
          console.error("Error: Unable to switch chain", error);
          throw new SwitchChainError(error as Error);
        }
      },

      async disconnect(): Promise<void> {
        const provider = await this.getProvider();
        provider.removeListener("accountsChanged", this.onAccountsChanged);
        provider.removeListener("chainChanged", this.onChainChanged);
        provider.removeListener("disconnect", this.onDisconnect);
        
        // Try to properly disconnect if the provider supports it
        if ((provider as any).disconnect && typeof (provider as any).disconnect === 'function') {
          try {
            await (provider as any).disconnect();
          } catch (error) {
            console.warn("Error during disconnect:", error);
          }
        }
      },

      async requestEmail(): Promise<unknown> {
        const provider = await this.getProvider();
        return provider.requestEmail();
      },

      async requestSBT(type: CredentialType): Promise<unknown> {
        const provider = await this.getProvider();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // biome-ignore lint/suspicious/noExplicitAny: the requestSBT method is not declared in the SilkEthereumProviderInterface, but is implemented in the EthereumProvider class
        return (provider as any).requestSBT(type);
      },

      onAccountsChanged(accounts) {
        if (accounts.length === 0) config.emitter.emit("disconnect");
        else
          config.emitter.emit("change", {
            accounts: accounts.map((x) => getAddress(x)),
          });
      },

      onChainChanged(chain) {
        const chainId = Number(chain);
        config.emitter.emit("change", { chainId });
      },

      onDisconnect(): void {
        config.emitter.emit("disconnect");
      },
    };
  });
}

// Export a function that creates the connector with default options
export const humanWalletConnector = (referralCode?: string) => {
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string;

  return silk({
    config: {
      allowedSocials: ["google", "twitter", "discord", "linkedin", "apple"],
      authenticationMethods: ["email", "phone", "social", "wallet"],
      styles: { darkMode: true },
    },
    walletConnectProjectId: projectId,
    useStaging: process.env.NEXT_PUBLIC_HUMAN_WALLET_STAGING === "true",
    referralCode,
  });
};
