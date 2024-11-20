import React, { useEffect, useRef } from "react";
import { WagmiProvider } from "wagmi";
import { wagmiConfig, web3Modal } from "../utils/web3";
import { useMessage } from "./useMessage";

export const Web3Context = ({ children }: { children: React.ReactNode }) => {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
};

const Web3ErrorChecker = () => {
  const { failure } = useMessage();
  const shownErrorsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const web3ErrorCheckInterval = setInterval(() => {
      const error: string = web3Modal.getError();
      if (error) {
        // Only show toast if we haven't shown this exact error before
        if (!shownErrorsRef.current.has(error)) {
          shownErrorsRef.current.add(error);
          failure({
            title: "Connection Error",
            message: error,
          });
        }
      }
    }, 1000);

    return () => clearInterval(web3ErrorCheckInterval);
  }, [failure]);

  return null;
};

export const Web3ErrorContext = ({ children }: { children: React.ReactNode }) => {
  // Render in parallel so that error updates don't cause app to rerender
  // Could move the error handling to a portal to really isolate it
  return (
    <>
      <Web3ErrorChecker />
      {children}
    </>
  );
};
