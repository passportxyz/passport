// --- React Methods
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// --- Shared data context
import { useWalletStore } from "../context/walletStore";

// --- Components
import { checkShowOnboard } from "../utils/helpers";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../components/DoneToastContent";
import { useNavigateToPage } from "../hooks/useCustomization";

import {
  useDisconnect,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalError,
  useWeb3ModalEvents,
  useWeb3ModalState,
} from "@web3modal/ethers/react";
import { datadogRum } from "@datadog/browser-rum";

type LoginStep = "NOT_STARTED" | "PENDING_WALLET_CONNECTION" | "PENDING_DATABASE_CONNECTION" | "DONE";

// Isolate login status updates and some workaround logic for web3modal
export const useLoginFlow = (): {
  loginStep: LoginStep;
  isLoggingIn: boolean;
  signIn: () => void;
} => {
  const address = useWalletStore((state) => state.address);
  const provider = useWalletStore((state) => state.provider);
  const { error } = useWeb3ModalError();
  const { isConnected } = useWeb3ModalAccount();
  const { open: web3ModalIsOpen } = useWeb3ModalState();
  const { disconnect } = useDisconnect();
  const { dbAccessTokenStatus, connect: connectDatastore } = useDatastoreConnectionContext();
  const [enabled, setEnabled] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("NOT_STARTED");
  const { open: openWeb3Modal } = useWeb3Modal();
  const isConnectingToDatabaseRef = useRef<boolean>(false);
  const toast = useToast();
  const navigateToPage = useNavigateToPage();
  const web3modalEvent = useWeb3ModalEvents();

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
  }, [web3modalEvent, resetLogin]);

  const showConnectionError = useCallback(
    (e: any) => {
      toast({
        duration: 6000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title={"Connection Error"}
            body={(e as Error).message}
            icon="../assets/verification-failed-bright.svg"
            result={result}
          />
        ),
      });
    },
    [toast]
  );

  useEffect(() => {
    if (error) {
      console.error("Web3Modal error", error);
      showConnectionError(error);
      resetLogin();
    }
  }, [error, toast, resetLogin]);

  useEffect(() => {
    const newLoginStep = (() => {
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
    if (web3ModalIsOpen && loginStep === "NOT_STARTED") {
      disconnect();
    }
  }, [web3ModalIsOpen, loginStep]);

  useEffect(() => {
    if (loginStep === "DONE") {
      if (checkShowOnboard()) {
        navigateToPage("welcome");
      } else {
        navigateToPage("dashboard");
      }
    }
  }, [loginStep, navigateToPage]);

  useEffect(() => {
    (async () => {
      if (!isConnectingToDatabaseRef.current && loginStep === "PENDING_DATABASE_CONNECTION" && address && provider) {
        isConnectingToDatabaseRef.current = true;
        try {
          await connectDatastore(address, provider);
        } catch (e) {
          resetLogin();
          console.error("Error connecting to database", e);
          datadogRum.addError(error);
          showConnectionError(e);
          isConnectingToDatabaseRef.current = false;
        }
      }
    })();
  }, [loginStep, address, provider, connectDatastore, showConnectionError, resetLogin]);

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
