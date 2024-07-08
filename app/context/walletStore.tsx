// --- Utils & configs
import { create } from "zustand";
import { Eip1193Provider } from "ethers";

type InternalSyncParams = {
  address?: string;
  chain?: string;
  provider?: Eip1193Provider;
};

// Managed by ./WalletStoreManager

const walletStore = create<{
  _internalSync: (params: InternalSyncParams) => void;
  provider?: Eip1193Provider;
  chain?: string;
  address?: string;
}>((set) => ({
  chain: undefined,
  address: undefined,
  provider: undefined,
  _internalSync: async (params: InternalSyncParams) => {
    // Only to be used as bridge between web3modal and walletStore, in WalletStoreManager
    // Could be removed when switching to wagmi, since we'll probably go ahead and change
    // all the hooks at that point and likely even get rid of the walletStore
    set(params);
  },
}));

// Export as hook
export const useWalletStore = walletStore;
