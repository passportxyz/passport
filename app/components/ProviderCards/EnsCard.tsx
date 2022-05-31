// --- React Methods
import React, { useContext, useState } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity";

// --- pull context
import { UserContext } from "../../context/userContext";

// --- import components
import { Card } from "../Card";
import { VerifyModal } from "../VerifyModal";
import { useDisclosure } from "@chakra-ui/react";

import { PROVIDER_ID, Stamp } from "@dpopp/types";
import { ProviderSpec } from "../../config/providers";

const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

const providerId: PROVIDER_ID = "Ens";

export default function EnsCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [ens, SetEns] = useState<string | undefined>(undefined);

  const handleFetchCredential = (): void => {
    setCredentialResponseIsLoading(true);
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
      .then((verified: { record: any; credential: any }): void => {
        SetEns(verified.record?.ens);
        SetCredentialResponse({
          provider: "Ens",
          credential: verified.credential,
        });
      })
      .catch((e: any): void => {})
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
        data-testid="button-verify-ens"
        className="verify-btn"
        onClick={() => {
          SetCredentialResponse(undefined);
          handleFetchCredential();
          onOpen();
        }}
      >
        Link to ENS
      </button>
      <VerifyModal
        isOpen={isOpen}
        onClose={onClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={
          <>
            {ens
              ? `The ens name associated with this address is ${ens}`
              : "Your address does not have an ENS domain associated"}
          </>
        }
        isLoading={credentialResponseIsLoading}
      />
    </>
  );

  return (
    <Card
      providerSpec={allProvidersState[providerId]!.providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
    />
  );
}
