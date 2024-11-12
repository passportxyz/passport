// --- React Methods
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// --- Shared data context

// --- Components
import { checkShowOnboard } from "../utils/helpers";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useNavigateToPage } from "../hooks/useCustomization";

import { datadogRum } from "@datadog/browser-rum";
import { useMessage } from "./useMessage";
import { useAppKit, useAppKitEvents, useAppKitState, useDisconnect } from "@reown/appkit/react";
import { useAccount, useWalletClient } from "wagmi";

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
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { open: web3ModalIsOpen } = useAppKitState();
  const { disconnect } = useDisconnect();
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
    console.log("web3modalEvent", web3modalEvent);
    if (web3modalEvent.data.event === "MODAL_CLOSE" && web3modalEvent.data.properties.connected === false) {
      resetLogin();
    }
  }, [web3modalEvent, resetLogin]);

  const showConnectionError = useCallback(
    (e: any) => {
      failure({
        title: "Connection Error",
        message: (e as Error).message,
      });
    },
    [failure]
  );

  // TODO The useWeb3ModalError hook is gone. Could write a
  // custom hook to poll modal.getError() ?
  // useEffect(() => {
  //   if (error) {
  //     console.error("Web3Modal error", error);
  //     showConnectionError(error);
  //     resetLogin();
  //   }
  // }, [error, resetLogin]);

  useEffect(() => {
    const newLoginStep = (() => {
      console.log("enabled", enabled, "isConnected", isConnected, "dbAccessToken", dbAccessTokenStatus);
      if (!enabled) return "NOT_STARTED";
      else if (!isConnected) return "PENDING_WALLET_CONNECTION";
      else if (dbAccessTokenStatus !== "connected") return "PENDING_DATABASE_CONNECTION";
      else return "DONE";
    })();
    setLoginStep(newLoginStep);
  }, [enabled, isConnected, dbAccessTokenStatus]);

  // Workaround for bug where if you disconnect from the modal on
  // the dashboard, the web3ModalIsOpen state is incorrect
  // until we call disconnect
  useEffect(() => {
    (async () => {
      if (web3ModalIsOpen && loginStep === "NOT_STARTED") {
        try {
          await disconnect();
        } catch (e) {
          // TODO
          console.error("Error disconnecting wallet", e);
        }
      }
    })();
  }, [web3ModalIsOpen, loginStep]);

  useEffect(() => {
    if (loginStep === "DONE") {
      if (onLoggedIn) {
        onLoggedIn();
      } else {
        if (checkShowOnboard()) {
          navigateToPage("welcome");
        } else {
          navigateToPage("dashboard");
        }
      }
    }
  }, [loginStep, navigateToPage]);

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
  }, [loginStep, address, walletClient, connectDatastore, showConnectionError, resetLogin]);

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
  }, [openWeb3Modal, isConnected, showConnectionError]);

  return useMemo(() => ({ loginStep, isLoggingIn, signIn }), [loginStep, isLoggingIn, signIn]);
};
