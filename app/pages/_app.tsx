// --- React Methods
import React from "react";

import { AppProps } from "next/app";
import "../styles/globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { UserContextProvider } from "../context/userContext";
import { CeramicContextProvider } from "../context/ceramicContext";

// --- Ceramic Tools
import { Provider as SelfIdProvider } from "@self.id/framework";
import Head from "next/head";

const FacebookAppId = process.env.NEXT_PUBLIC_DPOPP_FACEBOOK_APP_ID || "";

function MyApp({ Component, pageProps }: AppProps) {
  const facebookSdkScript = (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.fbAsyncInit = function() {
            FB.init({
              appId      : '${FacebookAppId}',
              cookie     : true,
              xfbml      : true,
              version    : 'v13.0'
            });
            FB.AppEvents.logPageView();
          };

          (function(d, s, id){
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
          }(document, 'script', 'facebook-jssdk'));
        `,
      }}
    />
  );
  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <title>Gitcoin Passport</title>
        {facebookSdkScript}
      </Head>
      <SelfIdProvider
        client={{ ceramic: `${process.env.NEXT_PUBLIC_CERAMIC_CLIENT_URL || "testnet-clay"}` }}
        session={true}
      >
        <UserContextProvider>
          <CeramicContextProvider>
            <ChakraProvider>
              <div suppressHydrationWarning>{typeof window === "undefined" ? null : <Component {...pageProps} />}</div>
            </ChakraProvider>
          </CeramicContextProvider>
        </UserContextProvider>
      </SelfIdProvider>
    </>
  );
}

export default MyApp;
