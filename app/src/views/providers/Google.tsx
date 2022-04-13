// --- React Methods
import React, { useState, useContext } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/src";

// --- Google OAuth toolkit
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";

// pull context
import { UserContext } from "../../App";

import { Card } from "../../components/Card";

// import from .env
const iamUrl = process.env.DPOPP_IAM_URL;
const googleClientId = process.env.DPOPP_GOOGLE_CLIENT_ID;

export function Google(): JSX.Element {
  const { address, signer, hasStamp, handleSaveStamp } = useContext(UserContext);
  // check the verified state by checking if passport.stamps has a Google stamp
  const [isGoogleVerified, setIsGoogleVerified] = useState(hasStamp("Google"));

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
        // Once we have a credential we can mark this provider as complete
        setIsGoogleVerified(!!profile.getEmail());
        // add the stamp
        handleSaveStamp({
          provider: "Google",
          credential: verified.credential,
        });
      })
      .catch((e): void => {
        throw e;
      });
  };

  const googleVCData = {
    icon: "",
    verificationButton: (
      <GoogleLogin
        clientId={googleClientId}
        onFailure={(response): void => onGoogleSignIn(response as GoogleLoginResponse)}
        onSuccess={(response): void => onGoogleSignIn(response as GoogleLoginResponse)}
        // To override all stylings...
        render={(renderProps): JSX.Element => (
          <button
            className="bg-gray-100 mb-10 mt-10 px-20 py-4 rounded-lg text-violet-500"
            onClick={renderProps.onClick}
            disabled={renderProps.disabled}
          >
            Verify with Google
          </button>
        )}
      ></GoogleLogin>
    ),
    name: "Google",
    description: "Google Provider",
    output: <div>{isGoogleVerified && <pre>Google: ✅ Verified</pre>}</div>,
  };

  return <Card vcdata={googleVCData} />;
}
