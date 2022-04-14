// --- React Methods
import React, { useState, useContext } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/src";

// --- Google OAuth toolkit
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";

// pull context
import { UserContext } from "../../App";

import { Card } from "../Card";

import { PROVIDER_ID } from "@dpopp/types";

// import from .env
const iamUrl = process.env.DPOPP_IAM_URL;
const googleClientId = process.env.DPOPP_GOOGLE_CLIENT_ID;

const providerId: PROVIDER_ID = "Google";

export function GoogleCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);

  const onGoogleSignIn = (response: GoogleLoginResponse): void => {
    // pull the users profile information
    const profile = response.getBasicProfile();

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
      signer
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
          onFailure={(response): void => onGoogleSignIn(response as GoogleLoginResponse)}
          onSuccess={(response): void => onGoogleSignIn(response as GoogleLoginResponse)}
          // To override all stylings...
          render={(renderProps): JSX.Element => (
            <button className="verify-btn" onClick={renderProps.onClick} disabled={renderProps.disabled}>
              Issue Verification
            </button>
          )}
        />
      }
    />
  );
}
