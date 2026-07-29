// --- React Methods
import React, { useEffect } from "react";

import { BroadcastChannel } from "broadcast-channel";

// --- Next Methods
import { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";

import "../styles/globals.css";
import { CeramicContextProvider } from "../context/ceramicContext";
import { DatastoreConnectionContextProvider } from "../context/datastoreConnectionContext";
import { ScorerContextProvider } from "../context/scorerContext";

// --- GTM Module
import TagManager from "react-gtm-module";

// --- Analytics
import posthog from "posthog-js";

import { themes, ThemeWrapper } from "../utils/theme";
import { StampClaimingContextProvider } from "../context/stampClaimingContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Web3Context, Web3ErrorContext } from "../hooks/Web3Context";
import { AutoVerificationProvider } from "../components/AutoVerificationProvider";

const GTM_ID = process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID || "";

// Fraction of sessions to session-replay. app.passport.xyz runs ~640
// sessions/day; 25% keeps ~160 recordings/day, enough to diagnose the
// verification funnel without paying for full coverage. Tunable via
// NEXT_PUBLIC_POSTHOG_REPLAY_RATE.
const REPLAY_SAMPLE_RATE = Number(process.env.NEXT_PUBLIC_POSTHOG_REPLAY_RATE ?? "0.25");

// Initialize PostHog (client-side only)
//
// Behavioral analytics standard: heatmaps, scroll, and click maps plus autocapture
// are enabled across every surface. Session replay is gated by surface type.
//
// Surface decision: app.passport.xyz (wallet / KYC / PII flows) and
// passport.human.tech (marketing landing) are served from this single Next.js SPA
// with one shared init and no clean route boundary that guarantees a wallet-free
// surface — the landing page (Home) itself hosts the SIWE connect-wallet button.
// Replay was previously DISABLED outright for that reason.
//
// It is now enabled as *fully masked* replay, which is what the earlier note
// deferred pending host/route separation. Masking makes the route boundary
// unnecessary: every input value and every piece of on-screen text is redacted
// in the browser, before anything is sent to PostHog, so a wallet or KYC screen
// yields layout and interaction timing but no content. That is what the funnel
// analysis actually needs — where users stall, misclick, or hit errors.
//
// Masking is set HERE and not in PostHog project settings on purpose. The
// project has no masking configured (session_recording_masking_config and
// session_replay_config are both null), and posthog-js only masks input values
// by default — on-screen text is NOT masked by default. Relying on the project
// defaults would have recorded rendered PII: names, dates of birth, document
// numbers, wallet addresses and balances.
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    enable_heatmaps: true,
    // Recording is started explicitly below so this app owns its sample rate
    // rather than inheriting the project-wide one (set low to stop waap.xyz, at
    // ~4,200 sessions/day, from dominating the bill).
    disable_session_recording: true,
    session_recording: {
      maskAllInputs: true,
      // "*" masks all on-screen text. Do not narrow this to a selector without
      // an audit of every wallet/KYC screen: the default (unmasked text) is
      // what makes replay unsafe on this app.
      maskTextSelector: "*",
    },
    // The project has capture_console_log_opt_in enabled. Console output on a
    // wallet/KYC app can carry addresses, tokens and raw API responses, so it
    // is disabled here regardless of the project setting.
    enable_recording_console_log: false,
  });

  // Register the behavioral-analytics dimensions as super properties so they ride
  // along on autocapture, pageview, and heatmap events.
  posthog.register({
    site: "passport",
    product: "passport",
    surface_type: "app",
  });

  if (Math.random() < REPLAY_SAMPLE_RATE) {
    // All four override keys are set explicitly rather than passing the `true`
    // shorthand, which covers only sampling and linked_flag. PostHog's ingestion
    // controls combine restrictively, so without this the project-level sample
    // rate would apply on top of the draw above and cut the sample again.
    posthog.startSessionRecording({
      sampling: true,
      linked_flag: true,
      url_trigger: true,
      event_trigger: true,
    });
  }
}

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
  useEffect(() => {
    TagManager.initialize({
      gtmId: `${GTM_ID}`,
      dataLayerName: "PageDataLayer",
      auth: "x5QDV_TH-F5l1dOIBFeviA",
      preview: "env-34",
    });
  }, []);

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
      <Script
        src="https://iris-v2-fqgd.onrender.com/widget/iris-widget.js"
        data-iris-key="passport"
        strategy="afterInteractive"
      />
    </>
  );
}

export default App;
