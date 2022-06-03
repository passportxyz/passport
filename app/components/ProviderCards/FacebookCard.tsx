// --- React Methods
import React, { useContext, useState } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity";

// --- UserContext
import { UserContext } from "../../context/userContext";

// --- Style Components
import { Card } from "../Card";

import { PROVIDER_ID } from "@dpopp/types";
import { ProviderSpec } from "../../config/providers";
import { datadogLogs } from "@datadog/browser-logs";

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
    datadogLogs.logger.info("Saving Stamp", { provider: "Facebook" });
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
        datadogLogs.logger.info("Successfully saved Stamp", { provider: "Facebook" });
      })
      .catch((e): void => {
        throw e;
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
