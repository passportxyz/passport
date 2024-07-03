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
  useWeb3ModalState,
} from "@web3modal/ethers/react";
import { datadogRum } from "@datadog/browser-rum";

type LoginStep = "NOT_STARTED" | "OPENING_MODAL" | "PENDING_WALLET_CONNECTION" | "PENDING_DATABASE_CONNECTION" | "DONE";

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
  const [web3modalWasOpen, setWeb3modalWasOpen] = useState(false);
  const { disconnect } = useDisconnect();
  const { dbAccessTokenStatus } = useDatastoreConnectionContext();
  const [enabled, setEnabled] = useState(false);
  const [loginStep, setLoginStep] = useState<LoginStep>("NOT_STARTED");
  const { open: openWeb3Modal } = useWeb3Modal();
  const { connect: connectDatastore } = useDatastoreConnectionContext();
  const isConnectingToDatabaseRef = useRef<boolean>(false);
  const toast = useToast();
  const navigateToPage = useNavigateToPage();

  const initiateLogin = useCallback(() => {
    setEnabled(true);
  }, []);

  const resetLogin = useCallback(() => {
    setEnabled(false);
  }, []);

  useEffect(() => {
    if (error) {
      console.error("Web3Modal error", error);
      toast({
        duration: 6000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title={"Connection Error"}
            body={(error as Error).message}
            icon="../assets/verification-failed-bright.svg"
            result={result}
          />
        ),
      });
      resetLogin();
    }
  }, [error, toast, resetLogin]);

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
    const newLoginStep = (() => {
      console.log("loginStep", enabled, isConnected, web3ModalIsOpen, web3modalWasOpen, dbAccessTokenStatus);
      // Stop login if web3modal was closed
      if (web3modalWasOpen && !web3ModalIsOpen && !isConnected && loginStep !== "OPENING_MODAL") {
        resetLogin();
        return "NOT_STARTED";
      }

      if (!enabled) return "NOT_STARTED";
      else if (!isConnected) return "OPENING_MODAL";
      else if (!isConnected && web3ModalIsOpen) return "PENDING_WALLET_CONNECTION";
      else if (dbAccessTokenStatus !== "connected") return "PENDING_DATABASE_CONNECTION";
      else return "DONE";
    })();
    setLoginStep(newLoginStep);
  }, [enabled, isConnected, web3ModalIsOpen, web3modalWasOpen, dbAccessTokenStatus]);

  // It takes a couple render cycles for web3ModalIsOpen to be
  // updated, so we need to keep track of the previous state
  useEffect(() => {
    setWeb3modalWasOpen(web3ModalIsOpen);
  }, [web3ModalIsOpen]);

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
        console.log("Connecting to database 1", isConnectingToDatabaseRef.current);
        isConnectingToDatabaseRef.current = true;
        console.log("Connecting to database 2", isConnectingToDatabaseRef.current);
        try {
          await connectDatastore(address, provider);
        } catch (e) {
          resetLogin();
          console.error("Error connecting to database", e);
          datadogRum.addError(error);
          showConnectionError(e);
        }
        isConnectingToDatabaseRef.current = false;
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
