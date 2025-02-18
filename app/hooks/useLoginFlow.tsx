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
  const { address, isConnected, connector } = useAccount();
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
    console.error("Debug Login Flow loginStep: ", loginStep);
    console.error("Debug Login Flow web3modalEvent: ", web3modalEvent);
    console.error("Debug Login Flow resetLogin: ", resetLogin);
    if (web3modalEvent.data.event === "MODAL_CLOSE" && web3modalEvent.data.properties.connected === false) {
      resetLogin();
    }
  }, [web3modalEvent, resetLogin, loginStep]);

  const showConnectionError = useCallback(
    (e: any) => {
      failure({
        title: "Connection Error",
        message: (e as Error).message,
      });
    },
    [failure]
  );

  useEffect(() => {
    console.error("Debug Login Flow enabled: ", enabled);
    console.error("Debug Login Flow isConnected: ", isConnected);
    console.error("Debug Login Flow dbAccessTokenStatus: ", dbAccessTokenStatus);

    const newLoginStep = (() => {
      if (!enabled) return "NOT_STARTED";
      else if (!isConnected) return "PENDING_WALLET_CONNECTION";
      else if (dbAccessTokenStatus !== "connected") return "PENDING_DATABASE_CONNECTION";
      else return "DONE";
    })();
    console.error("Debug Login Flow newLoginStep: ", newLoginStep);
    setLoginStep(newLoginStep);
  }, [enabled, isConnected, dbAccessTokenStatus]);

  // Workaround for bug where if you disconnect from the modal on
  // the dashboard, the web3ModalIsOpen state is incorrect
  // until we call disconnect
  useEffect(() => {
    console.error("Debug Login Flow web3ModalIsOpen: ", web3ModalIsOpen);
    console.error("Debug Login Flow loginStep: ", loginStep);
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
    console.error("Debug Login Flow loginStep: ", loginStep);
    console.error("Debug Login Flow navigateToPage: ", navigateToPage);
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
  }, [loginStep, navigateToPage, onLoggedIn]);

  useEffect(() => {
    console.error("Debug Login Flow loginStep: ", loginStep);
    console.error("Debug Login Flow address: ", address);
    console.error("Debug Login Flow connector: ", connector?.name);
    console.error("Debug Login Flow walletClient: ", walletClient);
    console.error("Debug Login Flow connectDatastore: ", connectDatastore);
    console.error("Debug Login Flow showConnectionError: ", showConnectionError);
    console.error("Debug Login Flow resetLogin: ", resetLogin);
    (async () => {
      if (
        !isConnectingToDatabaseRef.current &&
        loginStep === "PENDING_DATABASE_CONNECTION" &&
        address &&
        walletClient
      ) {
        isConnectingToDatabaseRef.current = true;
        try {
          console.log("DEBUG Obj Error: ", address);
          console.log("DEBUG Obj walletClient: ", walletClient);
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
    console.error("Debug Login Flow initiateLogin: ", initiateLogin);
    console.error("Debug Login Flow isConnected: ", isConnected);
    console.error("Debug Login Flow openWeb3Modal: ", openWeb3Modal);
    console.error("Debug Login Flow showConnectionError: ", showConnectionError);
    console.error("Debug Login Flow resetLogin: ", resetLogin);
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
