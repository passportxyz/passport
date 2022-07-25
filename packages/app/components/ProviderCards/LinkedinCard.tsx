// --- Methods
import React, { useContext, useEffect, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";

// --- Identity tools
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Style Components
import { Card } from "../Card";
import { DoneToastContent } from "../DoneToastContent";
import { useToast } from "@chakra-ui/react";

// --- Context
import { UserContext } from "../../context/userContext";
import { ProviderSpec } from "../../config/providers";
import { CeramicContext } from "../../context/ceramicContext";

// Each provider is recognised by its ID
const providerId: PROVIDER_ID = "Linkedin";

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

export default function LinkedinCard(): JSX.Element {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamp, allProvidersState } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
  const [state, setState] = useState("");

  // --- Chakra functions
  const toast = useToast();

  // Fetch Twitter OAuth2 url from the IAM procedure
  async function handleFetchLinkedinOAuth(): Promise<void> {
    // Generate a new state string and store it in the compoenents state so that we can
    // verify it later
    const state = "linkedin-" + generateUID(10);
    setState(state);
    // Fetch data from external API
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CALLBACK}&state=${state}&scope=r_emailaddress%20r_liteprofile`;
    openLinkedAuthURl(url);
  }

  // Open Twitter authUrl in centered window
  function openLinkedAuthURl(url: string): void {
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
    // when receiving linkedin oauth response from a spawned child run fetchVerifiableCredential
    if (e.target === "linkedin") {
      // pull data from message
      const queryCode = e.data.code;
      const queryState = e.data.state;

      if (state !== e.data.state) {
        datadogLogs.logger.error("State mismatch, failed to create Linkedin credential", { provider: "Linkedin" });
        setLoading(false);
        return;
      }

      datadogLogs.logger.info("Saving Stamp", { provider: providerId });
      // fetch and store credential
      setLoading(true);
      fetchVerifiableCredential(
        process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "",
        {
          type: providerId,
          version: "0.0.0",
          address: address || "",
          proofs: {
            code: queryCode, // provided by linkedin as query params in the redirect
            sessionKey: queryState,
          },
        },
        signer as { signMessage: (message: string) => Promise<string> }
      )
        .then(async (verified: { credential: any }): Promise<void> => {
          await handleAddStamp({
            provider: providerId,
            credential: verified.credential,
          });
          datadogLogs.logger.info("Successfully saved Stamp", { provider: providerId });
          // Custom Success Toast
          toast({
            duration: 5000,
            isClosable: true,
            render: (result: any) => <DoneToastContent providerId={providerId} result={result} />,
          });
        })
        .catch((e) => {
          datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
          datadogRum.addError(e, { provider: providerId });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  // attach and destroy a BroadcastChannel to handle the message
  useEffect(() => {
    // open the channel
    const channel = new BroadcastChannel("linkedin_oauth_channel");
    // event handler will listen for messages from the child (debounced to avoid multiple submissions)
    channel.onmessage = debounce(listenForRedirect, 300);

    return () => {
      channel.close();
    };
  });

  const issueCredentialWidget = (
    <button data-testid="button-verify-linkedin" className="verify-btn" onClick={handleFetchLinkedinOAuth}>
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
