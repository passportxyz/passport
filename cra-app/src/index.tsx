import React from "react";
import {BroadcastChannel} from "broadcast-channel";
import {HashRouter as Router, Route, Routes} from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Privacy from "./pages/privacy";
import {datadogRum} from "@datadog/browser-rum";
import {datadogLogs} from "@datadog/browser-logs";
import {UserContextProvider} from "./context/userContext";
import {CeramicContextProvider} from "./context/ceramicContext";
import {ChakraProvider} from "@chakra-ui/react";
import {Provider as SelfIdProvider} from "@self.id/react";
import '../public/globals.css'

datadogRum.init({
    applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID || "",
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || "",
    site: "datadoghq.eu",
    service: "passport-frontend",
    env: process.env.NEXT_PUBLIC_DATADOG_ENV || "",
    // Specify a version number to identify the deployed version of your application in Datadog
    // version: '1.0.0',
    sampleRate: 100,
    premiumSampleRate: 0,
    trackInteractions: true,
    defaultPrivacyLevel: "mask-user-input",
});

datadogLogs.init({
    clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || "",
    site: "datadoghq.eu",
    forwardErrorsToLogs: true,
    sampleRate: 100,
    service: `passport-frontend`,
    env: process.env.NEXT_PUBLIC_DATADOG_ENV || "",
});

const App = () => {
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
    // if Github oauth then submit message to other windows and close self
    else if ((queryError || queryCode) && queryState && /^github-.*/.test(queryState)) {
        // shared message channel between windows (on the same domain)
        const channel = new BroadcastChannel("github_oauth_channel");
        // only continue with the process if a code is returned
        if (queryCode) {
            channel.postMessage({ target: "github", data: { code: queryCode, state: queryState } });
        }
        // always close the redirected window
        window.close();

        return <div></div>;
    }

    return (
        <div>
            <SelfIdProvider
                client={{ceramic: `${process.env.NEXT_PUBLIC_CERAMIC_CLIENT_URL || "testnet-clay"}`}}
                session={true}
            >
                <UserContextProvider>
                    <CeramicContextProvider>
                        <ChakraProvider>
                            <Router>
                                <Routes>
                                    <Route path="/" element={<Home/>}/>
                                    <Route path="/dashboard" element={<Dashboard/>}/>
                                    <Route path="/privacy" element={<Privacy/>}/>
                                </Routes>
                            </Router>
                        </ChakraProvider>
                    </CeramicContextProvider>
                </UserContextProvider>
            </SelfIdProvider>
        </div>
    );
};

export default App;
