// --- Methods
import React, { useContext, useEffect, useMemo, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";

// --- Identity tools
import {
  Stamp,
  PLATFORM_ID,
  PROVIDER_ID,
  VerifiableCredential,
  CredentialResponseBody,
  VerifiableCredentialRecord,
} from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Style Components
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../DoneToastContent";

// --- Context
import { UserContext } from "../../context/userContext";
import { CeramicContext } from "../../context/ceramicContext";

// --- Platform definitions
import { getPlatformSpec } from "../../config/platforms";
import { STAMP_PROVIDERS } from "../../config/providers";
import { SideBarContent } from "../SideBarContent";

// --- Helpers
import { difference } from "../../utils/helpers";

// Each platform is recognised by its ID
const platformId: PLATFORM_ID = "Linkedin";

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
  const { handleAddStamps, allProvidersState, handleDeleteStamps } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
  const [state, setState] = useState("");
  const [canSubmit, setCanSubmit] = useState(false);

  // find all providerIds
  const providerIds = useMemo(
    () =>
      STAMP_PROVIDERS[platformId]?.reduce((all, stamp) => {
        return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
      }, [] as PROVIDER_ID[]) || [],
    []
  );

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>(
    providerIds.filter((providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined")
  );
  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  // Create Set to check initial verified providers
  const initialVerifiedProviders = new Set(verifiedProviders);

  // any time we change selection state...
  useEffect(() => {
    if (selectedProviders.length !== verifiedProviders.length) {
      setCanSubmit(true);
    }
  }, [selectedProviders, verifiedProviders]);

  // --- Chakra functions
  const toast = useToast();

  // Fetch Twitter OAuth2 url from the IAM procedure
  async function handleFetchLinkedinOAuth(): Promise<void> {
    // Generate a new state string and store it in the components state so that we can verify it later
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
        datadogLogs.logger.error("State mismatch, failed to create Linkedin credential", { platform: platformId });
        setLoading(false);
        return;
      }

      datadogLogs.logger.info("Saving Stamp", { platform: platformId });
      // fetch and store credential
      setLoading(true);
      fetchVerifiableCredential(
        process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "",
        {
          type: platformId,
          types: selectedProviders,
          version: "0.0.0",
          address: address || "",
          proofs: {
            code: queryCode, // provided by linkedin as query params in the redirect
            sessionKey: queryState,
          },
        },
        signer as { signMessage: (message: string) => Promise<string> }
      )
        .then(async (verified: VerifiableCredentialRecord): Promise<void> => {
          // because we provided a types array in the params we expect to receive a credentials array in the response...
          const vcs =
            verified.credentials
              ?.map((cred: CredentialResponseBody): Stamp | undefined => {
                if (!cred.error) {
                  // add each of the requested/received stamps to the passport...
                  return {
                    provider: cred.record?.type as PROVIDER_ID,
                    credential: cred.credential as VerifiableCredential,
                  };
                }
              })
              .filter((v: Stamp | undefined) => v) || [];
          // Update/remove stamps
          await handleDeleteStamps(providerIds as PROVIDER_ID[]);
          // Add all the stamps to the passport at once
          await handleAddStamps(vcs as Stamp[]);
          datadogLogs.logger.info("Successfully saved Stamp", { platform: platformId });
          // grab all providers who are verified from the verify response
          const actualVerifiedProviders = providerIds.filter(
            (providerId) =>
              !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
          );
          // both verified and selected should look the same after save
          setVerifiedProviders([...actualVerifiedProviders]);
          setSelectedProviders([...actualVerifiedProviders]);

          // Create Set to check changed providers after verification
          const updatedVerifiedProviders = new Set(actualVerifiedProviders);

          // Initial providers set minus updated providers set to determine which data points were removed
          const initialMinusUpdated = difference(initialVerifiedProviders, updatedVerifiedProviders);
          // Updated providers set minus initial providers set to determine which data points were added
          const updatedMinusInitial = difference(updatedVerifiedProviders, initialVerifiedProviders);
          // reset can submit state
          setCanSubmit(false);
          // Custom Success Toast
          if (updatedMinusInitial.size === providerIds.length) {
            completeVerificationToast();
          } else if (initialMinusUpdated.size > 0 && updatedMinusInitial.size === 0) {
            removedDataPointsToast(initialMinusUpdated);
          } else {
            failedVerificationToast();
          }
        })
        .catch((e) => {
          datadogLogs.logger.error("Verification Error", { error: e, platform: platformId });
          datadogRum.addError(e, { platform: platformId });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  // --- Done Toast Helpers
  const removedDataPointsToast = (initialVPs: Set<PROVIDER_ID>) => {
    return toast({
      duration: 5000,
      isClosable: true,
      render: (result: any) => (
        <DoneToastContent
          title="Success!"
          body={`You've removed ${initialVPs.size} ${platformId} data points. You can re-verify them later.`}
          icon="../../assets/check-icon.svg"
          platformId={platformId}
          result={result}
        />
      ),
    });
  };

  const completeVerificationToast = () => {
    return toast({
      duration: 5000,
      isClosable: true,
      render: (result: any) => (
        <DoneToastContent
          title="Done!"
          body={`${platformId} stamp completely verified.`}
          icon="../../assets/check-icon.svg"
          platformId={platformId}
          result={result}
        />
      ),
    });
  };

  const failedVerificationToast = () => {
    return toast({
      duration: 5000,
      isClosable: true,
      render: (result: any) => (
        <DoneToastContent
          title="Verificaton Failed"
          body="Please make sure you fulfill the requirements for this stamp."
          icon="../../assets/whiteBgShieldExclamation.svg"
          platformId={platformId}
          result={result}
        />
      ),
    });
  };

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

  return (
    <SideBarContent
      currentPlatform={getPlatformSpec(platformId)}
      currentProviders={STAMP_PROVIDERS[platformId]}
      verifiedProviders={verifiedProviders}
      selectedProviders={selectedProviders}
      setSelectedProviders={setSelectedProviders}
      isLoading={isLoading}
      verifyButton={
        <button
          disabled={!canSubmit}
          onClick={handleFetchLinkedinOAuth}
          data-testid="button-verify-linkedin"
          className="sidebar-verify-btn"
        >
          {verifiedProviders.length > 0 ? <p>Save</p> : <p>Verify</p>}
        </button>
      }
    />
  );
}
