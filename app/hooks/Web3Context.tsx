import React from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "../utils/web3";

export const Web3Context = ({ children }: { children: React.ReactNode }) => {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
};
