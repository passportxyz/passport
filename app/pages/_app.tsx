// --- React Methods
import React from "react";

import { AppProps } from "next/app";
import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { UserContextProvider } from "../context/userContext";

// --- Ceramic Tools
import { Provider } from "@self.id/framework";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider client={{ ceramic: "testnet-clay" }}>
      <UserContextProvider>
        <ChakraProvider>
          <div suppressHydrationWarning>{typeof window === "undefined" ? null : <Component {...pageProps} />}</div>
        </ChakraProvider>
      </UserContextProvider>
    </Provider>
  );
}

export default MyApp;
