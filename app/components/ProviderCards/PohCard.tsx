// --- React Methods
import React, { useContext, useState } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity";

// pull context
import { UserContext } from "../../context/userContext";

import { PROVIDER_ID, Stamp } from "@dpopp/types";

const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

// --- import components
import { Card } from "../Card";
import { VerifyModal } from "../VerifyModal";
import { useDisclosure } from "@chakra-ui/react";

const providerId: PROVIDER_ID = "Poh";

export default function PohCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [pohVerified, SetPohVerified] = useState<boolean | undefined>(undefined);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  const handleFetchCredential = (): void => {
    setCredentialResponseIsLoading(true);
    fetchVerifiableCredential(
      iamUrl,
      {
        type: "Poh",
        version: "0.0.0",
        address: address || "",
        proofs: {
          valid: address ? "true" : "false",
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified: { error?: string; record: any; credential: any }): void => {
        SetPohVerified(!verified.error);
        SetCredentialResponse({
          provider: "Poh",
          credential: verified.credential,
        });
      })
      .catch((e: any): void => {})
      .finally((): void => {
        setCredentialResponseIsLoading(false);
      });
  };

  const handleUserVerify = (): void => {
    handleAddStamp(credentialResponse!).finally(() => {
      setVerificationInProgress(false);
    });
    onClose();
  };

  const handleModalOnClose = (): void => {
    setVerificationInProgress(false);
    onClose();
  };

  const issueCredentialWidget = (
    <>
      <button
        data-testid="button-verify-poh"
        className="verify-btn"
        onClick={() => {
          setVerificationInProgress(true);
          SetCredentialResponse(undefined);
          handleFetchCredential();
          onOpen();
        }}
      >
        Connect PoH
      </button>
      <VerifyModal
        isOpen={isOpen}
        onClose={handleModalOnClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={<>{`The Proof of Humanity Status for this address ${pohVerified || "Is not Registered"}`}</>}
        isLoading={credentialResponseIsLoading}
      />
    </>
  );

  return (
    <Card
      providerSpec={allProvidersState[providerId]!.providerSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
      isLoading={verificationInProgress}
    />
  );
}
