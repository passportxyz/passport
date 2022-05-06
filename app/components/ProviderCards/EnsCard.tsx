// --- React Methods
import React, { useContext } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

// pull context
import { UserContext } from "../../context/userContext";

import { Card } from "../Card";

import { PROVIDER_ID } from "@dpopp/types";

const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

const providerId: PROVIDER_ID = "Ens";

export default function EnsCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);

  const handleFetchCredential = (): void => {
    fetchVerifiableCredential(
      iamUrl,
      {
        type: "Ens",
        version: "0.0.0",
        address: address || "",
        proofs: {
          valid: address ? "true" : "false",
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified: { credential: any }): void => {
        handleAddStamp({
          provider: "Ens",
          credential: verified.credential,
        });
      })
      .catch((e: any): void => {
        throw e;
      });
  };

  const issueCredentialWidget = (
    <button
      className="verify-btn"
      onClick={() => {
        handleFetchCredential();
      }}
    >
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
