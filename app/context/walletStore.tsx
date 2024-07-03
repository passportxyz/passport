// --- Utils & configs
import { create } from "zustand";
import { Eip1193Provider } from "ethers";
import { useSwitchNetwork } from "@web3modal/ethers/react";

type InternalSyncParams = {
  address?: string;
  chain?: string;
  provider?: Eip1193Provider;
};

const walletStore = create<{
  _internalSync: (params: InternalSyncParams) => void;
  setChain: (chain: string) => Promise<boolean>;
  provider?: Eip1193Provider;
  chain?: string;
  address?: string;
}>((set) => ({
  chain: undefined,
  address: undefined,
  provider: undefined,
  _internalSync: async (params: InternalSyncParams) => {
    // Only to be used as bridge between web3modal and walletStore, in WalletStoreSyncWithWeb3Modal
    // Could be removed when switching to wagmi, since we'll probably go ahead and change
    // all the hooks at that point and likely even get rid of the walletStore
    set(params);
  },
  setChain: async (chainId: string) => {
    const { switchNetwork } = useSwitchNetwork();
    switchNetwork(parseInt(chainId));
    return true;
  },
}));

// Export as hook
export const useWalletStore = walletStore;
