import { create } from "zustand";

type WalletPickerState = {
  isOpen: boolean;
  resolve?: (connected: boolean) => void;
};

const useWalletPickerStore = create<WalletPickerState>(() => ({ isOpen: false }));

// Opens the "Connect your wallet" picker (components/WalletPicker). Resolves true once a wallet
// connects, false if the user closes the picker instead.
export const openWalletPicker = (): Promise<boolean> =>
  new Promise((resolve) => {
    useWalletPickerStore.getState().resolve?.(false);
    useWalletPickerStore.setState({ isOpen: true, resolve });
  });

export const closeWalletPicker = (connected: boolean) => {
  const { resolve } = useWalletPickerStore.getState();
  useWalletPickerStore.setState({ isOpen: false, resolve: undefined });
  resolve?.(connected);
};

export const useWalletPickerOpen = () => useWalletPickerStore((state) => state.isOpen);
