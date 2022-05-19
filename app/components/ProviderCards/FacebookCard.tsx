// --- React Methods
import React, { useContext } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

// --- UserContext
import { UserContext } from "../../context/userContext";

// --- Style Components
import { Card } from "../Card";

import { PROVIDER_ID } from "@dpopp/types";
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

  const onClick = () => {
    //@ts-ignore assuming FB.init was already called; see facebookSdkScript in pages/index.tsx
    FB.login(function (response) {
      if (response.status === "connected") {
        onFacebookSignIn(response.authResponse);
      }
    });
  };

  const onFacebookSignIn = (response: ReactFacebookLoginInfo): void => {
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
      .then((verified): void => {
        handleAddStamp({
          provider: "Facebook",
          credential: verified.credential,
        });
      })
      .catch((e): void => {
        throw e;
      });
  };

  return (
    <Card
      providerSpec={allProvidersState[providerId]!.providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={
        <button className="verify-btn" onClick={onClick}>
          Verify
        </button>
      }
    />
  );
}
