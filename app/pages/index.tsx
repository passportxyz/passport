/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- Methods
import React from "react";
import { BroadcastChannel } from "broadcast-channel";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

// -- Next Methods
import type { NextPage } from "next";
import Head from "next/head";

// -- Pages
import Home from "./Home";
import Dashboard from "./Dashboard";
import Privacy from "./privacy";

// -- Datadog
import { datadogRum } from "@datadog/browser-rum";

const FacebookAppId = process.env.NEXT_PUBLIC_DPOPP_FACEBOOK_APP_ID || "";

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID || "",
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || "",
  site: "datadoghq.eu",
  service: "passport-frontend",
  env: "review",
  // Specify a version number to identify the deployed version of your application in Datadog
  // version: '1.0.0',
  sampleRate: 100,
  premiumSampleRate: 100,
  trackInteractions: true,
  defaultPrivacyLevel: "mask-user-input",
});

// datadogRum.startSessionReplayRecording();

const App: NextPage = () => {
  // pull any search params
  const queryString = new URLSearchParams(window?.location?.search);
  // Twitter oauth will attach code & state in oauth procedure
  const queryError = queryString.get("error");
  const queryCode = queryString.get("code");
  const queryState = queryString.get("state");

  // if Twitter oauth then submit message to other windows and close self
  if ((queryError || queryCode) && queryState && /^twitter-.*/.test(queryState)) {
    // shared message channel between windows (on the same domain)
    const channel = new BroadcastChannel("twitter_oauth_channel");
    // only continue with the process if a code is returned
    if (queryCode) {
      channel.postMessage({ target: "twitter", data: { code: queryCode, state: queryState } });
    }
    // always close the redirected window
    window.close();

    return <div></div>;
  }

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
    <div>
      <Head>
        {facebookSdkScript}
        <title>Gitcoin Passport</title>
      </Head>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
