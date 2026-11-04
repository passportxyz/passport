// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// --- Shared data context

// --- Components
import { hasValidStoredSession, useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useNavigateToPage, type Page } from "../hooks/useCustomization";

import { datadogRum } from "@datadog/browser-rum";
import { useMessage } from "./useMessage";
import { useAccount, useWalletClient, useSwitchChain, useConnect, type Connector } from "wagmi";
import { openWalletPicker } from "./useWalletPicker";
import { BaseError, UserRejectedRequestError } from "viem";
import { isExternalWalletLogin, isWaaPConnector, WAAP_CONNECTOR_ID, waapConnector } from "../utils/waap";
import { hasSeenOnboarding } from "../utils/onboardingStatus";

type LoginStep = "NOT_STARTED" | "PENDING_WALLET_CONNECTION" | "PENDING_DATABASE_CONNECTION" | "DONE";

type SignInOptions = { useWaap?: boolean };

export type LoginFlowState = {
  loginStep: LoginStep;
  isLoggingIn: boolean;
  /** A login is running (from any button), or the wallet is connecting or reconnecting on its own. */
  isBusy: boolean;
  signIn: (options?: SignInOptions) => void;
};

const isUserRejection = (e: unknown) =>
  e instanceof BaseError && !!e.walk((err) => err instanceof UserRejectedRequestError);

// WaaP's login window offers window.ethereum ("MetaMask" or "Browser Wallet"). Connect it through
// the wallet's own EIP-6963 connector when one is announced: that connector connects itself as soon
// as the wallet approves (wagmi injected onAccountsChanged → onConnect), so connecting the generic
// `injected` connector as well would leave two connections for one wallet, and disconnecting either
// revokes the site's MetaMask permission for both. `injected` is the fallback.
const findBrowserWalletConnector = async (connectors: readonly Connector[]): Promise<Connector | undefined> => {
  const ethereum =
    typeof window === "undefined" ? undefined : (window as { ethereum?: { isMetaMask?: boolean } }).ethereum;
  const announced = connectors.filter((c) => c.type === "injected" && c.id !== "injected" && !isWaaPConnector(c));
  if (ethereum) {
    for (const connector of announced) {
      if ((await connector.getProvider().catch(() => undefined)) === ethereum) return connector;
    }
    // A wallet may announce a wrapper rather than window.ethereum itself.
    if (ethereum.isMetaMask) {
      const metaMask = announced.find((c) => c.id === "io.metamask");
      if (metaMask) return metaMask;
    }
  }
  return connectors.find((c) => c.id === "injected");
};

// The login flow's state. Mounted once by LoginFlowProvider, so every sign-in button (Home, the
// header) shares one login: one loading state and one place that decides where to go after it.
const useLoginFlowState = (): LoginFlowState => {
  const { address, isConnected, isConnecting, isReconnecting, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();
  const { connectAsync, connectors } = useConnect();
  const { dbAccessTokenStatus, connect: connectDatastore } = useDatastoreConnectionContext();
  const [enabled, setEnabled] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("NOT_STARTED");
  const isConnectingToDatabaseRef = useRef<boolean>(false);
  const { failure } = useMessage();
  const navigateToPage = useNavigateToPage();

  const initiateLogin = useCallback(() => {
    setEnabled(true);
  }, []);

  // This state lives for the whole session, so each login must leave it clean for the next one.
  const resetLogin = useCallback(() => {
    setEnabled(false);
    isConnectingToDatabaseRef.current = false;
  }, []);

  const showConnectionError = useCallback(
    (e: unknown) => {
      failure({
        title: "Connection Error",
        message: e instanceof Error ? e.message : String(e),
      });
    },
    [failure]
  );

  useEffect(() => {
    const newLoginStep = (() => {
      if (!enabled) return "NOT_STARTED";
      else if (!isConnected) return "PENDING_WALLET_CONNECTION";
      else if (dbAccessTokenStatus !== "connected") return "PENDING_DATABASE_CONNECTION";
      else return "DONE";
    })();

    if (newLoginStep !== loginStep) {
      setLoginStep(newLoginStep);
    }
  }, [enabled, isConnected, dbAccessTokenStatus, loginStep, address]);

  useEffect(() => {
    // Ensure address is available before navigating (prevents race condition). `enabled` is already
    // false on the render after resetLogin below, while loginStep still reads DONE: navigate once.
    if (!enabled || loginStep !== "DONE" || !address) return;
    // Onboarding on an account's first login on this device, whatever the wallet; the dashboard after.
    const target: Page = hasSeenOnboarding(address) ? "dashboard" : "wallet-onboarding";
    // Navigate once, then end this login, so the shared state is idle until the next sign-in.
    resetLogin();
    navigateToPage(target);
  }, [enabled, loginStep, address, navigateToPage, resetLogin]);

  useEffect(() => {
    (async () => {
      if (
        !isConnectingToDatabaseRef.current &&
        loginStep === "PENDING_DATABASE_CONNECTION" &&
        address &&
        walletClient
      ) {
        isConnectingToDatabaseRef.current = true;
        try {
          // Ensure wallet is on mainnet before signing SIWE message
          // This fixes an issue where AppKit caches the last chain selection,
          // causing smart wallet signatures to fail verification on the backend.
          // A still-valid saved session is reused without signing, so no switch is needed then.
          if (chainId !== 1 && !hasValidStoredSession(address)) {
            try {
              await switchChainAsync({ chainId: 1 });
            } catch (switchError) {
              // If switch fails, continue anyway - the SIWE message will still specify chainId: 1
              console.warn("Could not switch to mainnet before signing:", switchError);
            }
          }
          await connectDatastore(address, walletClient);
        } catch (e) {
          resetLogin();
          console.error("Error connecting to database", e);
          datadogRum.addError(e);
          showConnectionError(e);
        }
      }
    })();
  }, [loginStep, address, walletClient, connectDatastore, showConnectionError, resetLogin, chainId, switchChainAsync]);

  const isLoggingIn = loginStep !== "DONE" && loginStep !== "NOT_STARTED";
  const isBusy = isLoggingIn || !!isConnecting || !!isReconnecting;

  const signIn = useCallback(
    async (options?: SignInOptions) => {
      try {
        initiateLogin();
        if (!isConnected) {
          if (options?.useWaap) {
            // Connect the onboarding flow directly through WaaP (Human Wallet) instead of the
            // generic wallet-select modal. The WaaP wagmi connector opens WaaP's email/social
            // login and initializes its own provider on connect; the rest of the SIWE/datastore
            // flow below is unchanged.
            // Prefer the connector registered on the config; fall back to the connector factory
            // directly (connectAsync accepts a CreateConnectorFn and sets it up on the fly).
            const registered = connectors.find((c) => c.id === WAAP_CONNECTOR_ID || c.name === "Human Wallet");
            try {
              await connectAsync({ connector: registered ?? waapConnector });
            } catch (e) {
              if (!isExternalWalletLogin(e)) throw e;
              if (e.loginMethod === "walletconnect") {
                throw new Error("WalletConnect sign-in isn't available yet. Use a browser wallet such as MetaMask.");
              }
              const browserWallet = await findBrowserWalletConnector(connectors);
              if (!browserWallet) throw new Error("No browser wallet found.");
              await connectAsync({ connector: browserWallet });
            }
          } else {
            // External wallets: the picker resolves false if the user closes it without connecting.
            const connected = await openWalletPicker();
            if (!connected) resetLogin();
          }
        }
      } catch (e) {
        console.error("Error connecting wallet", e);
        // Closing the wallet's login window is a cancel, not a failure: no error toast.
        if (!isUserRejection(e)) showConnectionError(e);
        resetLogin();
      }
    },
    [initiateLogin, isConnected, showConnectionError, resetLogin, connectAsync, connectors]
  );

  return useMemo(() => ({ loginStep, isLoggingIn, isBusy, signIn }), [loginStep, isLoggingIn, isBusy, signIn]);
};

const LoginFlowContext = createContext<LoginFlowState | undefined>(undefined);

// Mount once, inside the router (navigation) and the datastore connection provider.
export const LoginFlowProvider = ({ children }: { children: React.ReactNode }) => {
  const state = useLoginFlowState();
  return <LoginFlowContext.Provider value={state}>{children}</LoginFlowContext.Provider>;
};

export const useLoginFlow = (): LoginFlowState => {
  const state = useContext(LoginFlowContext);
  // Throw rather than fall back to a private copy: separate copies are what made the header and
  // Home disagree about whether a login was running.
  if (!state) throw new Error("useLoginFlow must be used inside LoginFlowProvider");
  return state;
};
