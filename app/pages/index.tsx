/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- Methods
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

// -- Next Methods
import type { NextPage } from "next";

// -- Pages
import Home from "./Home";
import Welcome from "./Welcome";
import Dashboard from "./Dashboard";
import Privacy from "./privacy";
import Maintenance from "./Maintenance";

// -- Datadog
import { datadogRum } from "@datadog/browser-rum";
import { datadogLogs } from "@datadog/browser-logs";
import { isServerOnMaintenance } from "../utils/helpers";

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID || "",
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN || "",
  site: process.env.NEXT_PUBLIC_DATADOG_SITE || "",
  service: process.env.NEXT_PUBLIC_DATADOG_SERVICE || "",
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

const App: NextPage = () => {
  if (isServerOnMaintenance()) {
    return <Maintenance />;
  }

  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/dashboard">
            <Route path=":customizationKey" element={<Dashboard />} />
            <Route path="" element={<Dashboard />} />
          </Route>
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
