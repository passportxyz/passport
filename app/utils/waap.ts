import { ChainNotConfiguredError, createConnector, type Connector } from "wagmi";
import { getAddress, SwitchChainError, UserRejectedRequestError } from "viem";
import { initWaaP, WAAP_METHOD } from "@human.tech/waap-sdk";
import type { CredentialType, InitWaaPOptions, WaaPEthereumProviderInterface } from "@human.tech/waap-sdk";
import { logoutHumanWallet } from "./humanWallet";

// Connector id used to find the WaaP (Human Wallet) connector in wagmi's connector list.
// Matches the id returned by the connector below (the official WaaP connector uses "waap").
export const WAAP_CONNECTOR_ID = "waap";

export type LoginResponse = "waap" | "human" | "injected" | "walletconnect" | null;

// Required with "wallet" in authenticationMethods (WaaP's EVM methods docs): the SDK connects external
// wallets, and wallets being linked, through WalletConnect. Without it both fail, so say so loudly.
const projectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string) || "default-project-id";
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  console.error(
    "NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set: wallet sign-in in the Human Wallet window and wallet linking will not work."
  );
}
const useStaging = process.env.NEXT_PUBLIC_USE_STAGING === "true";

// WaaP (Human Wallet) web app, opened from the account menu and the linked-wallets screen.
export const WAAP_WALLET_URL = useStaging ? "https://staging.waap.xyz" : "https://waap.xyz";

// WaaP (Human Wallet) init options. WaaP's login window is Passport's only sign-in, so it also
// lists external wallets ("wallet"). Choosing one makes login() return "injected" (or
// "walletconnect") instead of a WaaP account; the connector then throws
// ExternalWalletLoginError and useLoginFlow connects wagmi's own connector for that wallet.
export const WaaPConfig: InitWaaPOptions = {
  useStaging,
  config: {
    authenticationMethods: ["email", "phone", "social", "wallet"],
    allowedSocials: ["google", "twitter", "discord", "github"],
    styles: { darkMode: true },
    showSecured: true,
  },
  project: {
    name: "Human Passport",
  },
  walletConnectProjectId: projectId,
};

// WaaP signs only for WaaP accounts. For an external wallet chosen in its login window, the
// SDK just reports the choice, so Passport connects that wallet itself (useLoginFlow).
export class ExternalWalletLoginError extends Error {
  override name = "ExternalWalletLoginError";
  constructor(readonly loginMethod: "injected" | "walletconnect") {
    super(`An external wallet (${loginMethod}) was chosen in the Human Wallet login`);
  }
}

export const isExternalWalletLogin = (error: unknown): error is ExternalWalletLoginError =>
  (error as Error | undefined)?.name === "ExternalWalletLoginError";

/**
 * Type guard to check whether a wagmi connector is the WaaP connector.
 */
export function isWaaPConnector(connector: Connector | undefined): boolean {
  return connector?.id === WAAP_CONNECTOR_ID;
}

/**
 * Creates a wagmi connector for the WaaP (Human Wallet) SDK. Registered on the WagmiAdapter
 * (see web3.ts) so connecting to it opens the WaaP login modal and wagmi tracks the resulting
 * account — letting the existing SIWE/datastore and on-chain flows work through standard wagmi
 * hooks (useAccount, useSignMessage, useSendTransaction, …) unchanged.
 *
 * Adapted from the official example: holonym-foundation/waap-examples → waap-wagmi-nextjs.
 */
export default function WaaPConnector(options?: InitWaaPOptions) {
  let waapProvider: WaaPEthereumProviderInterface | null = null;

  return createConnector<WaaPEthereumProviderInterface>((config) => ({
    id: WAAP_CONNECTOR_ID,
    name: "Human Wallet",
    type: "WaaP",
    chains: config.chains,
    supportsSimulation: false,

    async connect({ chainId, withCapabilities = false }: { chainId?: number; withCapabilities?: boolean } = {}) {
      try {
        config.emitter.emit("message", { type: "connecting" });
        const provider = await this.getProvider();

        // Remove any existing listeners to prevent duplicates and MaxListenersExceededWarning
        provider.removeListener("accountsChanged", this.onAccountsChanged);
        provider.removeListener("chainChanged", this.onChainChanged);
        provider.removeListener("disconnect", this.onDisconnect);

        provider.on("accountsChanged", this.onAccountsChanged);
        provider.on("chainChanged", this.onChainChanged);
        provider.on("disconnect", this.onDisconnect);

        if (!provider.connected) {
          let loginMethod: LoginResponse;
          try {
            loginMethod = await provider.login();
          } catch (error) {
            console.warn("Unable to login", error);
            // Only a closed/cancelled login is a user rejection (the SDK uses code 4001 or a
            // "rejected" message). Rethrow anything else so real login failures still surface.
            const { code, message } = (error ?? {}) as { code?: number; message?: string };
            if (code === UserRejectedRequestError.code || /rejected/i.test(message ?? "")) {
              throw new UserRejectedRequestError(error as Error);
            }
            throw error;
          }
          if (loginMethod === "injected" || loginMethod === "walletconnect") {
            throw new ExternalWalletLoginError(loginMethod);
          }
        }

        let currentChainId = await this.getChainId();
        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId }).catch((error) => {
            if (error.code === UserRejectedRequestError.code) throw error;
            return { id: currentChainId };
          });
          currentChainId = chain?.id ?? currentChainId;
        }

        const accounts = await this.getAccounts();
        if (!accounts || accounts.length === 0) {
          throw new UserRejectedRequestError("No valid accounts found" as unknown as Error);
        }

        return {
          accounts: withCapabilities
            ? (accounts.map((account) => ({ address: account, capabilities: {} })) as any)
            : (accounts as any),
          chainId: currentChainId,
        };
      } catch (error) {
        console.error("Error while connecting to WaaP", error);
        // Not connected, so stop listening: otherwise a later SDK logout (accountsChanged [],
        // disconnect) reaches this connector while another one, e.g. MetaMask, is in use.
        const provider = await this.getProvider().catch(() => undefined);
        provider?.removeListener("accountsChanged", this.onAccountsChanged);
        provider?.removeListener("chainChanged", this.onChainChanged);
        provider?.removeListener("disconnect", this.onDisconnect);
        this.onDisconnect();
        throw error;
      }
    },

    async getAccounts() {
      try {
        const provider = await this.getProvider();
        const accounts = await provider.request({ method: WAAP_METHOD.eth_accounts });
        if (accounts && Array.isArray(accounts)) {
          return accounts
            .filter((x: string) => x && x.trim() !== "")
            .map((x: string) => {
              try {
                return getAddress(x);
              } catch (error) {
                console.warn("Invalid address received:", x, error);
                return null;
              }
            })
            .filter((x): x is `0x${string}` => x !== null);
        }
        return [];
      } catch (error) {
        console.warn("Error getting WaaP accounts:", error);
        return [];
      }
    },

    async getChainId() {
      const provider = await this.getProvider();
      const chainId = await provider.request({ method: WAAP_METHOD.eth_chainId });
      return Number(chainId);
    },

    async getProvider() {
      if (!waapProvider) {
        waapProvider = initWaaP(options ?? {});
        if (typeof window !== "undefined") {
          (window as any).waap = waapProvider;
        }
      }
      return waapProvider;
    },

    async isAuthorized() {
      try {
        const provider = await this.getProvider();
        // Only attempt a session restore when WaaP has a previously-stored login method.
        // eth_requestAccounts triggers the SDK's attemptAutoConnect (silent session restore);
        // with no stored session it rejects without showing the login modal. Plain eth_accounts
        // would return [] before the restore runs, dropping the connection on every refresh.
        // An external wallet chosen in WaaP's window is stored as "injected"/"walletconnect"; it is
        // reconnected by wagmi's own connector, never as a WaaP account.
        const method = provider.getLoginMethod?.();
        if (method !== "waap" && method !== "human") return false;
        const accounts = await provider.request({ method: WAAP_METHOD.eth_requestAccounts });
        return Array.isArray(accounts) && accounts.filter((x: string) => x && x.trim() !== "").length > 0;
      } catch (error) {
        console.warn("Error checking WaaP authorization:", error);
        return false;
      }
    },

    async switchChain({ chainId }) {
      try {
        const chain = config.chains.find((x) => x.id === chainId);
        if (!chain) throw new ChainNotConfiguredError();

        const provider = await this.getProvider();
        await provider.request({
          method: WAAP_METHOD.wallet_switchEthereumChain,
          params: [{ chainId: `0x${chain.id.toString(16)}` }],
        });
        config.emitter.emit("change", { chainId });
        return chain;
      } catch (error: unknown) {
        console.error("Error: Unable to switch WaaP chain", error);
        throw new SwitchChainError(error as Error);
      }
    },

    async disconnect() {
      const provider = await this.getProvider();
      // Log out to clear the user session, sharing one logout with useCustomDisconnect and the
      // session-cleared effect (each is a round trip to the WaaP iframe).
      void logoutHumanWallet(provider);
      provider.removeListener("accountsChanged", this.onAccountsChanged);
      provider.removeListener("chainChanged", this.onChainChanged);
      provider.removeListener("disconnect", this.onDisconnect);
    },

    getLoginMethod() {
      if (!waapProvider) return null;
      return waapProvider.getLoginMethod() as LoginResponse;
    },

    async login(customProvider?: unknown) {
      const provider = await this.getProvider();
      return provider.login(customProvider) as Promise<LoginResponse>;
    },

    async logout() {
      const provider = await this.getProvider();
      return provider.logout();
    },

    async requestEmail(): Promise<unknown> {
      const provider = await this.getProvider();
      return provider.requestEmail();
    },

    async requestSBT(type: CredentialType): Promise<unknown> {
      const provider = await this.getProvider();
      return (provider as unknown as { requestSBT: (type: CredentialType) => Promise<unknown> }).requestSBT(type);
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit("disconnect");
      } else {
        const validAccounts = accounts
          .filter((x: string) => x && x.trim() !== "")
          .map((x: string) => {
            try {
              return getAddress(x);
            } catch (error) {
              console.warn("Invalid address in accountsChanged:", x, error);
              return null;
            }
          })
          .filter((x): x is `0x${string}` => x !== null);

        if (validAccounts.length > 0) {
          config.emitter.emit("change", { accounts: validAccounts });
        } else {
          config.emitter.emit("disconnect");
        }
      }
    },

    onChainChanged(chain) {
      const chainId = Number(chain);
      config.emitter.emit("change", { chainId });
    },

    onDisconnect() {
      config.emitter.emit("disconnect");
    },
  }));
}

// Connector instance registered on the WagmiAdapter (web3.ts).
export const waapConnector = WaaPConnector(WaaPConfig);
