// --- React Methods
import React, { useContext, useEffect, useMemo, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

import { debounce } from "ts-debounce";

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

// --- UserContext
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

// --- Style Components
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../DoneToastContent";

// --- Platform definitions
import { getPlatformSpec } from "../../config/platforms";
import { STAMP_PROVIDERS } from "../../config/providers";
import { SideBarContent } from "../SideBarContent";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

// Each platform is recognised by its ID
const platformId: PLATFORM_ID = "Diia";

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

export default function DiiaCard(): JSX.Element {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamps, allProvidersState } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [state, setState] = useState("");

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

  // Fetch Diia OAuth url from the IAM procedure
  async function handleFetchDiiaOAuth(): Promise<void> {
    const state = "diia-" + generateUID(10);
    setState(state);
    // open new window for authUrl
    // const authUrl = `https://test.id.gov.ua/?response_type=code&scope=identify&client_id=${
    //   process.env.NEXT_PUBLIC_PASSPORT_DIIA_CLIENT_ID
    // }&state=diia-${generateUID(10)}&redirect_uri=${process.env.NEXT_PUBLIC_PASSPORT_DIIA_CALLBACK}&auth_type=dig_sign`;
    const authUrl = 'https://uwallet.netlify.app/?state={state}';
    openDiiaOAuthUrl(authUrl);
  }

  // Open Diia authUrl in centered window
  function openDiiaOAuthUrl(url: string): void {
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
  // TODO finish listener and IAM
  // Listener to watch for oauth redirect response on other windows (on the same host)
  function listenForRedirect(e: { target: string; data: { code: string; state: string } }) {
    // when receiving diia oauth response from a spawned child run fetchVerifiableCredential
    if (e.target === "diia") {
      // pull data from message
      const queryCode = e.data.code;
      const queryState = e.data.state;

      datadogLogs.logger.info("Saving Stamp", { platform: platformId });
      // fetch and store credential
      setLoading(true);

      // fetch VCs for only the selectedProviders
      fetchVerifiableCredential(
        process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "",
        {
          type: platformId,
          types: selectedProviders,
          version: "0.0.0",
          address: address || "",
          proofs: {
            code: queryCode, // provided by twitter as query params in the redirect
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
          datadogLogs.logger.info("Successfully saved Stamp", { platform: platformId });
          // grab all providers who are verified from the verify response
          const actualVerifiedProviders = providerIds.filter(
            (providerId) =>
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
            render: (result: any) => <DoneToastContent platformId={platformId} result={result} />,
          });
        })
        .catch((e) => {
          datadogLogs.logger.error("Verification Error", { error: e, platform: platformId });
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
    const channel = new BroadcastChannel("diia_oauth_channel");
    // event handler will listen for messages from the child (debounced to avoid multiple submissions)
    // channel.onmessage = debounce(listenForRedirect, 300);

    return () => {
      channel.close();
    };
  });

  return (
    <SideBarContent
      currentPlatform={getPlatformSpec("Diia")}
      currentProviders={STAMP_PROVIDERS["Diia"]}
      verifiedProviders={verifiedProviders}
      selectedProviders={selectedProviders}
      setSelectedProviders={setSelectedProviders}
      isLoading={isLoading}
      verifyButton={
        <button
          disabled={!canSubmit}
          onClick={handleFetchDiiaOAuth}
          data-testid="button-verify-diia"
          className="sidebar-verify-btn"
        >
          Verify
        </button>
      }
    />
  );
}
