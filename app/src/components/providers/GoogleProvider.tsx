// --- React Methods
import React, { useState, useContext } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/src";

// --- Google OAuth toolkit
import GoogleLogin, { GoogleLoginResponse } from "react-google-login";

// pull context
import { UserContext } from "../../App";

import { Card } from "../Card";

// import from .env
const iamUrl = process.env.DPOPP_IAM_URL;
const googleClientId = process.env.DPOPP_GOOGLE_CLIENT_ID;

export function GoogleProvider(): JSX.Element {
  const { address, signer, hasStamp, handleSaveStamp, handleAddStamp } = useContext(UserContext);
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
        handleAddStamp({
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
          <button className="verify-btn" onClick={renderProps.onClick} disabled={renderProps.disabled}>
            Issue Verification
          </button>
        )}
      ></GoogleLogin>
    ),
    name: "Google",
    description: "Google Provider",
    output: <div>{isGoogleVerified && <pre>Google: ✅ Verified</pre>}</div>,
    isVerified: isGoogleVerified,
  };

  return <Card vcdata={googleVCData} />;
}
