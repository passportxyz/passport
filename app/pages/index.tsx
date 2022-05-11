/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- Methods
import React from "react";
import { BroadcastChannel } from "broadcast-channel";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

// -- Next Methods
import type { NextPage } from "next";

// -- Pages
import Home from "./Home";
import Dashboard from "./Dashboard";

const App: NextPage = () => {
  // pull any search params
  const queryString = new URLSearchParams(window?.location?.search);
  // Twitter oauth will attach code & state in oauth procedure
  const queryCode = queryString.get("code");
  const queryState = queryString.get("state");

  // if Twitter oauth then submit message to other windows and close self
  if (queryCode && queryState && /^twitter-.*/.test(queryState)) {
    // shared message channel between windows (on the same domain)
    const channel = new BroadcastChannel("twitter_oauth_channel");

    channel.postMessage({ target: "twitter", data: { code: queryCode, state: queryState } });
    window.close();

    return <div></div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
