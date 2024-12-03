import React, { useEffect } from "react";
import { useDisconnect } from "wagmi";

// Resets wallet connection if the ENV var is incremented
const useResetWalletConnection = () => {
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

const PageRoot = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  useResetWalletConnection();

  return <div className={`bg-background font-body ${className}`}>{children}</div>;
};

export default PageRoot;
