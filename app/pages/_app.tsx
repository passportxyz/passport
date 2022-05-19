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
          <div className="font-miriam-libre min-h-max min-h-default bg-white text-gray-100">
            <div className="container mx-auto px-5 py-2" suppressHydrationWarning>
              {typeof window === "undefined" ? null : <Component {...pageProps} />}
            </div>
          </div>
        </ChakraProvider>
      </UserContextProvider>
    </Provider>
  );
}

export default MyApp;
