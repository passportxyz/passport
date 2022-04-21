import { AppProps } from "next/app";
import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // <UserContext.Provider value={stateMemo}>
    <ChakraProvider>
      <Component {...pageProps} />
    </ChakraProvider>
    // </UserContext.Provider>
  );
}

export default MyApp;
