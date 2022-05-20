// --- React Methods
import React, { useContext, useState } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

// pull context
import { UserContext } from "../../context/userContext";

import { Card } from "../Card";
import { VerifyModal } from "../VerifyModal";
import { useDisclosure } from "@chakra-ui/react";

import { PROVIDER_ID, Stamp } from "@dpopp/types";

const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

const providerId: PROVIDER_ID = "POAP";

export default function PoapCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [poapVerified, SetPoapVerified] = useState<Stamp | undefined>(undefined);

  // fetch an example VC from the IAM server
  const handleFetchCredential = (): void => {
    setCredentialResponseIsLoading(true);
    fetchVerifiableCredential(
      iamUrl,
      {
        address: address || "",
        type: providerId,
        version: "0.0.0",
        proofs: {},
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified: { record: any; credential: any }): void => {
        console.log("geri: ", verified);
        SetPoapVerified(verified.record?.poaps);
        SetCredentialResponse({
          provider: "POAP",
          credential: verified.credential,
        });
      })
      .catch((e: any): void => { })
      .finally((): void => {
        setCredentialResponseIsLoading(false);
      });
  };

  const handleUserVerify = (): void => {
    if (credentialResponse) {
      handleAddStamp(credentialResponse);
    }
    onClose();
  };

  const issueCredentialWidget = (
    <>
      <button
        className="verify-btn"
        data-testid="button-verify-poap"
        onClick={() => {
          SetCredentialResponse(undefined);
          handleFetchCredential();
          onOpen();
        }}>
        Connect to POAP
      </button>
      <VerifyModal
        isOpen={isOpen}
        onClose={onClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={
          <>
            {poapVerified
              ? "Your POAP verification was successful!"
              : "Your address does not have an POAP associated older than 15 days"}
          </>
        }
        isLoading={credentialResponseIsLoading}
      />
    </>
  );

  return (
    <Card
      providerSpec={allProvidersState[providerId]!.providerSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
    />
  );
}
