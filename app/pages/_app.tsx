// --- React Methods
import React, { useEffect } from "react";

import { BroadcastChannel } from "broadcast-channel";

// --- Next Methods
import { AppProps } from "next/app";
import Head from "next/head";

import "../styles/globals.css";
import { UserContextProvider } from "../context/userContext";
import { CeramicContextProvider } from "../context/ceramicContext";
import ManageAccountCenter from "../components/ManageAccountCenter";

// --- Ceramic Tools
import { Provider as SelfIdProvider } from "@self.id/framework";

// --- GTM Module
import TagManager from "react-gtm-module";

import { themes, ThemeWrapper } from "../utils/theme";

const FacebookAppId = process.env.NEXT_PUBLIC_PASSPORT_FACEBOOK_APP_ID || "";
const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID || "";
const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "";

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
    TagManager.initialize({ gtmId: `${GTM_ID}` });
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

  const facebookSdkScript = (
    <script
      id="facebook-app-script"
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
            <ManageAccountCenter>
              <ChakraProvider>
                <div className="darkMode" suppressHydrationWarning>
                  {typeof window === "undefined" ? null : <Component {...pageProps} />}
                </div>
              </ChakraProvider>
            </ManageAccountCenter>
          </CeramicContextProvider>
        </UserContextProvider>
      </SelfIdProvider>
    </>
  );
}

export default App;
