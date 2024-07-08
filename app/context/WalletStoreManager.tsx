// --- React Methods
import React, { useEffect, useState } from "react";

// --- Utils & configs
import { useWeb3ModalAccount, useWeb3ModalProvider } from "@web3modal/ethers/react";
import { useWalletStore } from "./walletStore";
import { useNavigateToPage } from "../hooks/useCustomization";

const WalletStoreSyncWithWeb3Modal = () => {
  const _internalSync = useWalletStore((state) => state._internalSync);
  const navigateToPage = useNavigateToPage();
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(undefined);

  const { walletProvider: web3modalProvider } = useWeb3ModalProvider();
  const web3modalAccount = useWeb3ModalAccount();

  useEffect(() => {
    if (!web3modalAccount.isConnected) {
      _internalSync({ address: undefined, chain: undefined, provider: undefined });
    }
  }, [web3modalAccount.isConnected]);

  useEffect(() => {
    if (web3modalAccount.isConnected) {
      const { address, chainId } = web3modalAccount;

      if (address) {
        if (!connectedAddress) {
          setConnectedAddress(address);
        } else if (connectedAddress !== address) {
          navigateToPage("home");
        }
      }

      const chain = chainId ? "0x" + chainId.toString(16) : undefined;

      _internalSync({
        provider: web3modalProvider,
        address,
        chain,
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
