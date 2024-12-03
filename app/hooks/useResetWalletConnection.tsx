import { useEffect } from "react";
import { useDisconnect } from "wagmi";

// Resets wallet connection if the ENV var is incremented
export const useResetWalletConnection = () => {
  const { disconnect } = useDisconnect();

  useEffect(() => {
    const savedWalletResetIndex = localStorage.getItem("walletResetIndex");
    const currentWalletResetIndex = process.env.NEXT_PUBLIC_WALLET_CONNECTION_RESET_INDEX || "";

    if (currentWalletResetIndex && currentWalletResetIndex !== savedWalletResetIndex) {
      localStorage.setItem("walletResetIndex", currentWalletResetIndex);
      try {
        disconnect();
      } catch {}
    }
  }, [disconnect]);
};
