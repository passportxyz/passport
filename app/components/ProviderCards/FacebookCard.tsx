// --- React Methods
import React, { useContext, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- UserContext
import { UserContext } from "../../context/userContext";

// --- Style Components
import { Card } from "../Card";
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../DoneToastContent";

import { PROVIDER_ID } from "@gitcoin/passport-types";
import { ProviderSpec } from "../../config/providers";

export interface ReactFacebookLoginInfo {
  id: string;
  userID: string;
  accessToken: string;
  name?: string | undefined;
  email?: string | undefined;
  picture?:
    | {
        data: {
          height?: number | undefined;
          is_silhouette?: boolean | undefined;
          url?: string | undefined;
          width?: number | undefined;
        };
      }
    | undefined;
}

// import from .env
const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

const providerId: PROVIDER_ID = "Facebook";

export default function FacebookCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const [isLoading, setLoading] = useState(false);

  // --- Chakra functions
  const toast = useToast();

  const onClick = () => {
    setLoading(true);
    //@ts-ignore assuming FB.init was already called; see facebookSdkScript in pages/index.tsx
    FB.login(function (response) {
      if (response.status === "connected") {
        onFacebookSignIn(response.authResponse);
      } else {
        setLoading(false);
      }
    });
  };

  const onFacebookSignIn = (response: ReactFacebookLoginInfo): void => {
    datadogLogs.logger.info("Saving Stamp", { provider: providerId });
    // fetch the verifiable credential
    fetchVerifiableCredential(
      iamUrl,
      {
        type: "Facebook",
        version: "0.0.0",
        address: address || "",
        proofs: {
          accessToken: response.accessToken,
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then(async (verified): Promise<void> => {
        await handleAddStamp({
          provider: "Facebook",
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
      .catch((e): void => {
        datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
        datadogRum.addError(e, { provider: providerId });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Card
      providerSpec={allProvidersState[providerId]!.providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={
        <button data-testid="button-verify-facebook" className="verify-btn" onClick={onClick}>
          Connect account
        </button>
      }
      isLoading={isLoading}
    />
  );
}
