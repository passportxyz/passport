// --- React Methods
import React, { useEffect } from "react";

import { BroadcastChannel } from "broadcast-channel";

// --- Next Methods
import { AppProps } from "next/app";
import Head from "next/head";

import "../styles/globals.css";
import { CeramicContextProvider } from "../context/ceramicContext";
import { DatastoreConnectionContextProvider } from "../context/datastoreConnectionContext";
import { ScorerContextProvider } from "../context/scorerContext";

// --- GTM Module
import TagManager from "react-gtm-module";

import { themes, ThemeWrapper } from "../utils/theme";
import { StampClaimingContextProvider } from "../context/stampClaimingContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useIntercom } from "../hooks/useIntercom";
import { Web3Context, Web3ErrorContext } from "../hooks/Web3Context";
import { AutoVerificationProvider } from "../components/AutoVerificationProvider";

const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID || "";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent unhandled errors from RPC failures (e.g., balance fetches)
      // from crashing the app. These are usually non-critical.
      throwOnError: false,
      retry: 1,
    },
  },
});

const RenderOnlyOnClient = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <>{children}</>;
};

function App({ Component, pageProps }: AppProps) {
  const { initialize } = useIntercom();

  useEffect(() => {
    TagManager.initialize({
      gtmId: `${GTM_ID}`,
      dataLayerName: "PageDataLayer",
      auth: "x5QDV_TH-F5l1dOIBFeviA",
      preview: "env-34",
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      initialize();
    }
  }, [initialize]);

  if (typeof window !== "undefined") {
    // pull any search params
    const queryString = new URLSearchParams(window?.location?.search);
    // Twitter oauth will attach code & state in oauth procedure
    const queryError = queryString.get("error");
    const queryCode = queryString.get("code");
    const queryState = queryString.get("state");
    // Steam OpenID uses openid.claimed_id instead of code
    const openIdClaimedId = queryString.get("openid.claimed_id");

    // We expect for a queryState like" 'twitter-asdfgh', 'google-asdfghjk'
    const providerPath = queryState?.split("-");
    const provider = providerPath ? providerPath[0] : undefined;

    // Handle Steam OpenID response
    const code = queryCode || openIdClaimedId || null;

    // if Twitter oauth or Steam OpenID then submit message to other windows and close self
    if ((queryError || code) && queryState && provider) {
      // shared message channel between windows (on the same domain)
      const channel = new BroadcastChannel(`${provider}_oauth_channel`);

      // only continue with the process if a code is returned
      if (code) {
        channel.postMessage({
          target: provider,
          data: { code: code, state: queryState },
        });
      }

      // always close the redirected window
      window.close();

      return <div></div>;
    }
  }

  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/favicon.png" />
        <title>Human Passport</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />
      </Head>
      <Web3Context>
        <QueryClientProvider client={queryClient}>
          <DatastoreConnectionContextProvider>
            <ScorerContextProvider>
              <CeramicContextProvider>
                <StampClaimingContextProvider>
                  <RenderOnlyOnClient>
                    <ThemeWrapper initChakra={true} defaultTheme={themes.LUNARPUNK_DARK_MODE}>
                      <Web3ErrorContext>
                        <AutoVerificationProvider>
                          <Component {...pageProps} />
                        </AutoVerificationProvider>
                      </Web3ErrorContext>
                    </ThemeWrapper>
                  </RenderOnlyOnClient>
                </StampClaimingContextProvider>
              </CeramicContextProvider>
            </ScorerContextProvider>
          </DatastoreConnectionContextProvider>
        </QueryClientProvider>
      </Web3Context>
    </>
  );
}

export default App;
