// --- React Methods
import React, { useEffect, useContext } from "react";

import { AppProps } from "next/app";
import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { UserContextProvider } from "../context/userContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserContextProvider>
      <ChakraProvider>
        <div className="font-miriam-libre min-h-max min-h-default bg-violet-700 font-librefranklin text-gray-100">
          <div className="container mx-auto px-5 py-2">
            <Component {...pageProps} />
          </div>
        </div>
      </ChakraProvider>
    </UserContextProvider>
  );
}

export default MyApp;
