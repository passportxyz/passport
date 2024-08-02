// --- React Methods
import React, { useEffect } from "react";

import { BroadcastChannel } from "broadcast-channel";

// // --- Next Methods
import { AppProps } from "next/app";
import Head from "next/head";

import "../styles/globals.css";
import "../utils/web3";
import { CeramicContextProvider } from "../context/ceramicContext";
import { DatastoreConnectionContextProvider } from "../context/datastoreConnectionContext";
import { ScorerContextProvider } from "../context/scorerContext";

// --- Ceramic Tools
import { Provider as SelfIdProvider } from "@self.id/framework";

// --- GTM Module
import TagManager from "react-gtm-module";

import { themes, ThemeWrapper } from "../utils/theme";
import { StampClaimingContextProvider } from "../context/stampClaimingContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID || "";
const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "";

const queryClient = new QueryClient();

const RenderOnlyOnClient = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = React.useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <h1>Server</h1>;
  }

  return <>{children}</>;
};

// Type definition for the window object
declare global {
  interface Window {
    intercomSettings?: {
      api_base: string;
      app_id: string;
    };
    Intercom: any;
  }
}

function App({ Component, pageProps }: AppProps) {
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
      window.intercomSettings = {
        api_base: "https://api-iam.intercom.io",
        app_id: INTERCOM_APP_ID,
      };
      (function () {
        var w: any = window;
        var ic = w.Intercom;
        if (typeof ic === "function") {
          ic("reattach_activator");
          ic("update", w.intercomSettings);
        } else {
          var d = document;
          var i = function () {
            // @ts-ignore
            i.c(arguments);
          };
          // @ts-ignore
          i.q = [];
          // @ts-ignore
          i.c = function (args) {
            // @ts-ignore
            i.q.push(args);
          };
          w.Intercom = i;
          var l = function () {
            var s = d.createElement("script");
            s.type = "text/javascript";
            s.async = true;
            s.src = "https://widget.intercom.io/widget/" + INTERCOM_APP_ID;
            var x = d.getElementsByTagName("script")[0];
            x.parentNode?.insertBefore(s, x);
          };
          if (document.readyState === "complete") {
            l();
          } else if (w.attachEvent) {
            w.attachEvent("onload", l);
          } else {
            w.addEventListener("load", l, false);
          }
        }
      })();
    }
  }, []);

  if (typeof window !== "undefined") {
    // pull any search params
    const queryString = new URLSearchParams(window?.location?.search);
    // Twitter oauth will attach code & state in oauth procedure
    const queryError = queryString.get("error");
    const queryCode = queryString.get("code");
    const queryState = queryString.get("state");

    // We expect for a queryState like" 'twitter-asdfgh', 'google-asdfghjk'
    const providerPath = queryState?.split("-");
    const provider = providerPath ? providerPath[0] : undefined;

    // if Twitter oauth then submit message to other windows and close self
    if ((queryError || queryCode) && queryState && provider) {
      // shared message channel between windows (on the same domain)
      const channel = new BroadcastChannel(`${provider}_oauth_channel`);

      // only continue with the process if a code is returned
      if (queryCode) {
        channel.postMessage({ target: provider, data: { code: queryCode, state: queryState } });
      }

      // always close the redirected window
      window.close();

      return <div></div>;
    }
  }

  console.log(
    process.env.NEXT_PUBLIC_PASSPORT_COINBASE_CALLBACK,
    "NEXT_PUBLIC_PASSPORT_COINBASE_CALLBACK",
    process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID,
    "NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID"
  );

  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/favicon.png" />
        <title>Passport XYZ</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <SelfIdProvider client={{ ceramic: `${process.env.NEXT_PUBLIC_CERAMIC_CLIENT_URL || "testnet-clay"}` }}>
          <DatastoreConnectionContextProvider>
            <ScorerContextProvider>
              <CeramicContextProvider>
                <StampClaimingContextProvider>
                  <RenderOnlyOnClient>
                    <ThemeWrapper initChakra={true} defaultTheme={themes.LUNARPUNK_DARK_MODE}>
                      <Component {...pageProps} />
                    </ThemeWrapper>
                  </RenderOnlyOnClient>
                </StampClaimingContextProvider>
              </CeramicContextProvider>
            </ScorerContextProvider>
          </DatastoreConnectionContextProvider>
        </SelfIdProvider>
      </QueryClientProvider>
    </>
  );
}

export default App;
