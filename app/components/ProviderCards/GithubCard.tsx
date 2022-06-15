// --- Methods
import React, { useContext, useEffect, useState } from "react";
import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";

// --- Identity tools
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Components
import { Card } from "../Card";

// --- Context
import { UserContext } from "../../context/userContext";
import { ProviderSpec } from "../../config/providers";
import { datadogLogs } from "@datadog/browser-logs";

// Each provider is recognised by its ID
const providerId: PROVIDER_ID = "Github";

function generateUID(length: number) {
  return window
    .btoa(
      Array.from(window.crypto.getRandomValues(new Uint8Array(length * 2)))
        .map((b) => String.fromCharCode(b))
        .join("")
    )
    .replace(/[+/]/g, "")
    .substring(0, length);
}

export default function GithubCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const [isLoading, setLoading] = useState(false);
  const [state, setState] = useState("");

  // Fetch Github OAuth2 url from the IAM procedure
  async function handleFetchGithubOAuth(): Promise<void> {
    // Generate a new state string and store it in the compoenents state so that we can
    // verify it later
    const state = "github-" + generateUID(10);
    setState(state);

    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_DPOPP_GITHUB_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_DPOPP_GITHUB_CALLBACK}&state=${state}`;
    openGithubOAuthUrl(githubUrl);
  }

  // Open Github authUrl in centered window
  function openGithubOAuthUrl(url: string): void {
    const width = 600;
    const height = 800;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;

    // Pass data to the page via props
    window.open(
      url,
      "_blank",
      "toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=" +
        width +
        ", height=" +
        height +
        ", top=" +
        top +
        ", left=" +
        left
    );
  }

  // Listener to watch for oauth redirect response on other windows (on the same host)
  function listenForRedirect(e: { target: string; data: { code: string; state: string } }) {
    // when receiving github oauth response from a spawned child run fetchVerifiableCredential
    if (e.target === "github") {
      // pull data from message
      const queryCode = e.data.code;

      if (state !== e.data.state) {
        datadogLogs.logger.error("State mismatch, failed to create Github credential", { provider: "Github" });
        setLoading(false);
        return;
      }

      datadogLogs.logger.info("Saving Stamp", { provider: "Github" });
      // fetch and store credential
      setLoading(true);
      fetchVerifiableCredential(
        process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "",
        {
          type: providerId,
          version: "0.0.0",
          address: address || "",
          proofs: {
            code: queryCode, // provided by github as query params in the redirect
          },
        },
        signer as { signMessage: (message: string) => Promise<string> }
      )
        .then(async (verified: { credential: any }): Promise<void> => {
          await handleAddStamp({
            provider: providerId,
            credential: verified.credential,
          });
          datadogLogs.logger.info("Successfully saved Stamp", { provider: "Github" });
        })
        .catch((e) => {
          datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
          throw e;
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  // attach and destroy a BroadcastChannel to handle the message
  useEffect(() => {
    // open the channel
    const channel = new BroadcastChannel("github_oauth_channel");
    // event handler will listen for messages from the child (debounced to avoid multiple submissions)
    channel.onmessage = debounce(listenForRedirect, 300);

    return () => {
      channel.close();
    };
  });

  const issueCredentialWidget = (
    <button data-testid="button-verify-github" className="verify-btn" onClick={handleFetchGithubOAuth}>
      Connect account
    </button>
  );

  return (
    <Card
      providerSpec={allProvidersState[providerId]!.providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
      isLoading={isLoading}
    />
  );
}
