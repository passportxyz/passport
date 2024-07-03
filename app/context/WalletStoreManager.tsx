// --- React Methods
import React, { useEffect } from "react";

// --- Utils & configs
import { useWeb3ModalAccount, useWeb3ModalError, useWeb3ModalProvider } from "@web3modal/ethers/react";
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../components/DoneToastContent";
import { useWalletStore } from "./walletStore";

const WalletStoreSyncWithWeb3Modal = () => {
  const _internalSync = useWalletStore((state) => state._internalSync);
  const { walletProvider: web3modalProvider } = useWeb3ModalProvider();

  const web3modalAccount = useWeb3ModalAccount();

  useEffect(() => {
    if (!web3modalAccount.isConnected) {
      _internalSync({ address: undefined, chain: undefined, provider: undefined });
    }
  }, [web3modalAccount.isConnected]);

  useEffect(() => {
    if (web3modalAccount.isConnected) {
      _internalSync({
        provider: web3modalProvider,
        address: web3modalAccount.address,
        chain: web3modalAccount.chainId?.toString(16),
      });
    }
  }, [web3modalAccount.isConnected, web3modalProvider, web3modalAccount.address, web3modalAccount.chainId]);

  return null;
};

const Web3ModalErrorDisplay = () => {
  const { error } = useWeb3ModalError();
  const toast = useToast();

  useEffect(() => {
    if (error) {
      console.log("displaying web3modal error", error);
      console.log("displaying web3modal error", (error as Error).message);
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
    }
  }, [error]);

  return null;
};

export const WalletStoreManager = ({ children }: { children: React.ReactNode }) => {
  // Don't add anything here that will cause a re-render of this component

  return (
    <>
      {/* Render these components in parallel so they can't cause the whole app to re-render */}
      <WalletStoreSyncWithWeb3Modal />
      <Web3ModalErrorDisplay />
      {children}
    </>
  );
};
