// --- React Methods
import React, { useContext } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

// --- Google OAuth toolkit
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";

// pull context
import { UserContext } from "../../context/userContext";

import { Card } from "../Card";

import { PROVIDER_ID } from "@dpopp/types";

// import from .env
const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";
const googleClientId = process.env.NEXT_PUBLIC_DPOPP_GOOGLE_CLIENT_ID || "";

const providerId: PROVIDER_ID = "Google";

export default function GoogleCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);

  const onGoogleSignIn = (response: GoogleLoginResponse): void => {
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
      .then((verified): void => {
        handleAddStamp({
          provider: "Google",
          credential: verified.credential,
        });
      })
      .catch((e): void => {
        throw e;
      });
  };

  return (
    <Card
      providerSpec={allProvidersState[providerId].providerSpec}
      verifiableCredential={allProvidersState[providerId].stamp?.credential}
      issueCredentialWidget={
        <GoogleLogin
          clientId={googleClientId}
          onFailure={(response): void =>
            // onGoogleSignIn(response as GoogleLoginResponse)
            console.log("Google Login")
          }
          onSuccess={(response): void => onGoogleSignIn(response as GoogleLoginResponse)}
          // To override all stylings...
          render={(renderProps): JSX.Element => (
            <button className="verify-btn" onClick={renderProps.onClick}>
              Verify
            </button>
          )}
        />
      }
    />
  );
}
