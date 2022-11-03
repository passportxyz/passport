// --- Methods
import React, { useContext, useEffect, useMemo, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";

// --- Identity tools
import {
  Stamp,
  VerifiableCredential,
  CredentialResponseBody,
  VerifiableCredentialRecord,
} from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Style Components
import { SideBarContent } from "./SideBarContent";
import { DoneToastContent } from "./DoneToastContent";
import { useToast } from "@chakra-ui/react";

// --- Context
import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

// --- Types
import { PlatformGroupSpec } from "@gitcoin/passport-platforms/dist/commonjs/src/types";
import { Platform } from "@gitcoin/passport-platforms/dist/commonjs/src/types";
import { getPlatformSpec, PROVIDER_ID } from "@gitcoin/passport-platforms/dist/commonjs/src/platforms-config";

type PlatformProps = {
  // platformId: string;
  platformgroupspec: PlatformGroupSpec[];
  platform: Platform;
};

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

export const GenericOauthPlatform = ({ platformgroupspec, platform }: PlatformProps): JSX.Element => {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamps, allProvidersState } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  // find all providerIds
  const providerIds = useMemo(
    () =>
      platformgroupspec?.reduce((all, stamp) => {
        return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
      }, [] as PROVIDER_ID[]) || [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>(
    providerIds.filter((providerId) => {
      typeof allProvidersState[providerId!]?.stamp?.credential !== "undefined";
    })
  );
  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  // any time we change selection state...
  useEffect(() => {
    if (selectedProviders.length !== verifiedProviders.length) {
      setCanSubmit(true);
    }
    if (selectedProviders.length === 0) {
      setCanSubmit(false);
    }
  }, [selectedProviders, verifiedProviders]);

  // --- Chakra functions
  const toast = useToast();

  const state = `${platform.path}-` + generateUID(10);

  // Open authUrl in centered window
  function openOAuthUrl(url: string): void {
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

  const handleVerifyStamps = async () => {
    const authUrl: string = await platform.getOAuthUrl(state);
    openOAuthUrl(authUrl);
  };

  // Listener to watch for oauth redirect response on other windows (on the same host)
  function listenForRedirect(e: { target: string; data: { code: string; state: string } }) {
    // when receiving oauth response from a spawned child run fetchVerifiableCredential
    if (e.target === platform.path) {
      // pull data from message
      const queryCode = e.data.code;
      const queryState = e.data.state;

      datadogLogs.logger.info("Saving Stamp", { platform: platform.platformId });
      // fetch and store credential
      setLoading(true);

      // fetch VCs for only the selectedProviders
      fetchVerifiableCredential(
        process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "",
        {
          type: platform.platformId,
          types: selectedProviders,
          version: "0.0.0",
          address: address || "",
          proofs: {
            code: queryCode, // provided by the provider as query params in the redirect
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
          // Add all the stamps to the passport at once
          await handleAddStamps(vcs as Stamp[]);
          // report success to datadog
          datadogLogs.logger.info("Successfully saved Stamp", { platform: platform.platformId });
          // grab all providers who are verified from the verify response
          const actualVerifiedProviders = providerIds.filter(
            (providerId: string | undefined) =>
              !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
          );
          // both verified and selected should look the same after save
          setVerifiedProviders([...actualVerifiedProviders]);
          setSelectedProviders([...actualVerifiedProviders]);
          // reset can submit state
          setCanSubmit(false);
          // Custom Success Toast
          toast({
            duration: 5000,
            isClosable: true,
            render: (result: any) => (
              <DoneToastContent
                title="Success!"
                body={`All ${platform.platformId} data points verified.`}
                icon="../../assets/check-icon.svg"
                platformId={platform.platformId}
                result={result}
              />
            ),
          });
        })
        .catch((e) => {
          datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
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
    const channel = new BroadcastChannel(`${platform.path}_oauth_channel`);
    // event handler will listen for messages from the child (debounced to avoid multiple submissions)
    channel.onmessage = debounce(listenForRedirect, 300);

    return () => {
      channel.close();
    };
  }, [platform.path, selectedProviders]);

  return (
    <SideBarContent
      currentPlatform={getPlatformSpec(platform.platformId)}
      currentProviders={platformgroupspec}
      verifiedProviders={verifiedProviders}
      selectedProviders={selectedProviders}
      setSelectedProviders={setSelectedProviders}
      isLoading={isLoading}
      verifyButton={
        <button
          disabled={!canSubmit}
          onClick={handleVerifyStamps}
          data-testid={`button-verify-${platform.platformId}`}
          className="sidebar-verify-btn"
        >
          Verify
        </button>
      }
    />
  );
};
