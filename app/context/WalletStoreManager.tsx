// --- React Methods
import React, { useEffect } from "react";

// --- Utils & configs
import { useWeb3ModalAccount, useWeb3ModalProvider } from "@web3modal/ethers/react";
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
        chain: "0x" + web3modalAccount.chainId?.toString(16),
      });
    }
  }, [web3modalAccount.isConnected, web3modalProvider, web3modalAccount.address, web3modalAccount.chainId]);

  return null;
};

export const WalletStoreManager = ({ children }: { children: React.ReactNode }) => {
  // Don't add anything here that will cause a re-render of this component

  return (
    <>
      {/* Render this component in parallel so it can't cause the whole app to re-render */}
      <WalletStoreSyncWithWeb3Modal />
      {children}
    </>
  );
};
