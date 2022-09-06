// --- React Methods
import React, { useContext, useState, useEffect, useMemo } from "react";

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

// --- Google OAuth toolkit
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";

// -- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// pull context
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

// --- Style Components
import { SideBarContent } from "../SideBarContent";
import { DoneToastContent } from "../DoneToastContent";
import { useToast } from "@chakra-ui/react";

// --- Platform definitions
import { getPlatformSpec } from "../../config/platforms";
import { STAMP_PROVIDERS } from "../../config/providers";

// import from .env
const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const googleClientId = process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID || "";

// Each platform is recognised by its ID
const platformId: PLATFORM_ID = "Google";

export default function GooglePlatform(): JSX.Element {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamps, allProvidersState } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
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

  const onGoogleSignIn = (response: GoogleLoginResponse): void => {
    datadogLogs.logger.info("Saving Stamp", { platform: platformId });

    // fetch VCs for only the selectedProviders
    fetchVerifiableCredential(
      iamUrl,
      {
        type: platformId,
        types: selectedProviders,
        version: "0.0.0",
        address: address || "",
        proofs: {
          tokenId: response.tokenId,
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
      .catch((e): void => {
        datadogLogs.logger.error("Verification Error", { error: e, platformId: platformId });
        throw e;
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onGoogleSignInFailure = (): void => {
    setLoading(false);
  };

  return (
    <SideBarContent
      currentPlatform={getPlatformSpec("Google")}
      currentProviders={STAMP_PROVIDERS["Google"]}
      verifiedProviders={verifiedProviders}
      selectedProviders={selectedProviders}
      setSelectedProviders={setSelectedProviders}
      verifyButton={
        <GoogleLogin
          clientId={googleClientId}
          onFailure={onGoogleSignInFailure}
          onSuccess={(response): void => onGoogleSignIn(response as GoogleLoginResponse)}
          // To override all stylings...
          render={(renderProps): JSX.Element => (
            <button
              disabled={!canSubmit}
              data-testid="button-verify-google"
              className="sidebar-verify-btn"
              onClick={() => {
                setLoading(true);
                renderProps.onClick();
              }}
            >
              Verify
            </button>
          )}
        />
      }
    />
  );
}
