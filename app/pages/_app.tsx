import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // <UserContext.Provider value={stateMemo}>
    <ChakraProvider>
      <div className="font-librefranklin font-miriam-libre min-h-default min-h-max bg-violet-700 text-gray-100">
        <div className="container mx-auto px-5 py-2">
          <Component {...pageProps} />
        </div>
      </div>
    </ChakraProvider>
    // </UserContext.Provider>
  );
}

export default MyApp;
