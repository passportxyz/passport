// --- React Methods
import React, { useContext } from "react";

// --- Identity tools
import { PROVIDER_ID } from "@dpopp/types";
import { fetchVerifiableCredential } from "@dpopp/identity/src";

// pull context
import { UserContext } from "../../App";

import { Card } from "../Card";

const iamUrl = process.env.DPOPP_IAM_URL;

const providerId: PROVIDER_ID = "Simple";

export function SimpleCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);

  // fetch an example VC from the IAM server
  const handleFetchCredential = (): void => {
    fetchVerifiableCredential(
      iamUrl,
      {
        address: address || "",
        type: "Simple",
        version: "0.0.0",
        proofs: {
          valid: "true",
          username: "test",
        },
      },
      signer
    )
      .then((res): void => {
        handleAddStamp({
          provider: "Simple",
          credential: res.credential,
        });
      })
      .catch((e): void => {
        throw e;
      });
  };

  const issueCredentialWidget = (
    <button className="verify-btn" onClick={handleFetchCredential}>
      Verify
    </button>
  );

  return (
    <Card
      providerSpec={allProvidersState[providerId].providerSpec}
      verifiableCredential={allProvidersState[providerId].stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
    />
  );
}
