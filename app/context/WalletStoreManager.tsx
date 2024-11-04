// --- React Methods
import React, { useEffect, useState } from "react";

// --- Utils & configs
import { useAppKitAccount, useAppKitProvider, useAppKitState } from "@reown/appkit/react";
import { useWalletStore } from "./walletStore";
import { useNavigateToPage } from "../hooks/useCustomization";
import { Eip1193Provider } from "ethers";

const WalletStoreSyncWithWeb3Modal = () => {
  const _internalSync = useWalletStore((state) => state._internalSync);
  const navigateToPage = useNavigateToPage();
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>(undefined);

  const { address, isConnected } = useAppKitAccount();
  const { activeChain } = useAppKitState();
  const { walletProvider } = useAppKitProvider<Eip1193Provider>("eip155");

  useEffect(() => {
    if (!isConnected) {
      _internalSync({ address: undefined, chain: undefined, provider: undefined });
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      if (address) {
        if (!connectedAddress) {
          setConnectedAddress(address);
        } else if (connectedAddress !== address) {
          const campaignId = window.location.toString().match(/\/campaign\/([^/]+)/)?.[1] || null;
          if (campaignId) {
            navigateToPage(`campaign/${campaignId}`);
          } else {
            navigateToPage("home");
          }
        }
      }

      const chain = activeChain ? "0x" + parseInt(activeChain).toString(16) : undefined;

      _internalSync({
        provider: walletProvider,
        address,
        chain,
      });
    }
  }, [isConnected, walletProvider, address, activeChain]);

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
