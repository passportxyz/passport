// --- React Methods
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// --- Shared data context

// --- Components
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useNavigateToPage } from "../hooks/useCustomization";

import { datadogRum } from "@datadog/browser-rum";
import { useMessage } from "./useMessage";
import { useAppKit, useAppKitEvents, useAppKitState, useDisconnect } from "@reown/appkit/react";
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";

type LoginStep = "NOT_STARTED" | "PENDING_WALLET_CONNECTION" | "PENDING_DATABASE_CONNECTION" | "DONE";

// Isolate login status updates and some workaround logic for web3modal
export const useLoginFlow = ({
  onLoggedIn,
}: {
  onLoggedIn?: () => void;
} = {}): {
  loginStep: LoginStep;
  isLoggingIn: boolean;
  signIn: () => void;
} => {
  const { address, isConnected, connector, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { open: web3ModalIsOpen } = useAppKitState();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { dbAccessTokenStatus, connect: connectDatastore } = useDatastoreConnectionContext();
  const [enabled, setEnabled] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("NOT_STARTED");
  const { open: openWeb3Modal } = useAppKit();
  const isConnectingToDatabaseRef = useRef<boolean>(false);
  const { failure } = useMessage();
  const navigateToPage = useNavigateToPage();
  const web3modalEvent = useAppKitEvents();

  const initiateLogin = useCallback(() => {
    setEnabled(true);
  }, []);

  const resetLogin = useCallback(() => {
    setEnabled(false);
  }, []);

  useEffect(() => {
    if (web3modalEvent.data.event === "MODAL_CLOSE" && web3modalEvent.data.properties.connected === false) {
      resetLogin();
    }
  }, [web3modalEvent, resetLogin, loginStep]);

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

  // Workaround for bug where if you disconnect from the modal on
  // the dashboard, the web3ModalIsOpen state is incorrect
  // until we call disconnect
  useEffect(() => {
    (async () => {
      if (web3ModalIsOpen && loginStep === "NOT_STARTED") {
        try {
          await disconnect();
        } catch (e) {
          console.error("Error disconnecting wallet", e);
        }
      }
    })();
  }, [web3ModalIsOpen, loginStep, disconnect]);

  useEffect(() => {
    // Ensure address is available before navigating (prevents race condition)
    if (loginStep === "DONE" && address) {
      if (onLoggedIn) {
        onLoggedIn();
      } else {
        navigateToPage("dashboard");
      }
    }
  }, [loginStep, navigateToPage, onLoggedIn, address]);

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
          // causing smart wallet signatures to fail verification on the backend
          if (chainId !== 1) {
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
          isConnectingToDatabaseRef.current = false;
        }
      }
    })();
  }, [loginStep, address, walletClient, connectDatastore, showConnectionError, resetLogin, chainId, switchChainAsync]);

  const isLoggingIn = loginStep !== "DONE" && loginStep !== "NOT_STARTED";

  const signIn = useCallback(async () => {
    try {
      initiateLogin();
      if (!isConnected) {
        await openWeb3Modal();
      }
    } catch (e) {
      console.error("Error connecting wallet", e);
      showConnectionError(e);
      resetLogin();
    }
  }, [initiateLogin, isConnected, openWeb3Modal, showConnectionError, resetLogin]);

  return useMemo(() => ({ loginStep, isLoggingIn, signIn }), [loginStep, isLoggingIn, signIn]);
};
