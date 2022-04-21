import { AppProps } from "next/app";
import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { UserContextProvider } from "../context/userContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserContextProvider>
      <ChakraProvider>
        <div className="font-librefranklin font-miriam-libre min-h-default min-h-max bg-violet-700 text-gray-100">
          <div className="container mx-auto px-5 py-2">
            <Component {...pageProps} />
          </div>
        </div>
      </ChakraProvider>
    </UserContextProvider>
  );
}

export default MyApp;
