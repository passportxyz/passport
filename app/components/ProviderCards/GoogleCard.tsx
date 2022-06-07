// --- React Methods
import React, { useContext, useState } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity";

// --- Google OAuth toolkit
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";

// -- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// pull context
import { UserContext } from "../../context/userContext";

// --- Style Components
import { Card } from "../Card";
import { DoneToastContent } from "../DoneToastContent";
import { useToast } from "@chakra-ui/react";

import { PROVIDER_ID } from "@dpopp/types";
import { ProviderSpec } from "../../config/providers";

// import from .env
const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";
const googleClientId = process.env.NEXT_PUBLIC_DPOPP_GOOGLE_CLIENT_ID || "";

const providerId: PROVIDER_ID = "Google";

export default function GoogleCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const [isVerified, setIsVerified] = useState<boolean | undefined>(undefined);

  const [isLoading, setLoading] = useState(false);

  // --- Chakra functions
  const toast = useToast();

  const onGoogleSignIn = (response: GoogleLoginResponse): void => {
    datadogLogs.logger.info("Saving Stamp", { provider: "Google" });
    // fetch the verifiable credential
    fetchVerifiableCredential(
      iamUrl,
      {
        type: "Google",
        version: "0.0.0",
        address: address || "",
        proofs: {
          tokenId: response.tokenId,
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then(async (verified): Promise<void> => {
        setIsVerified(true);
        await handleAddStamp({
          provider: "Google",
          credential: verified.credential,
        });
        datadogLogs.logger.info("Successfully saved Stamp", { provider: "Google" });
      })
      .catch((e): void => {
        throw e;
      })
      .finally(() => {
        setLoading(false);
        if (isVerified) {
          // Custom Done Toast
          toast({
            duration: 5000,
            isClosable: true,
            render: (result: any) => <DoneToastContent providerId={providerId} result={result} />,
          });
        }
      });
  };

  const onGoogleSignInFailure = (): void => {
    setLoading(false);
  };

  return (
    <Card
      isLoading={isLoading}
      providerSpec={allProvidersState[providerId]!.providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={
        <GoogleLogin
          clientId={googleClientId}
          onFailure={onGoogleSignInFailure}
          onSuccess={(response): void => onGoogleSignIn(response as GoogleLoginResponse)}
          // To override all stylings...
          render={(renderProps): JSX.Element => (
            <button
              data-testid="button-verify-google"
              className="verify-btn"
              onClick={() => {
                setLoading(true);
                renderProps.onClick();
              }}
            >
              Connect account
            </button>
          )}
        />
      }
    />
  );
}
