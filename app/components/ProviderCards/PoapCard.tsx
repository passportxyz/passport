// --- React Methods
import React, { useContext, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// pull context
import { UserContext } from "../../context/userContext";

// --- Chakra Elements
import { ModalFooter, Button, useDisclosure, Text, useToast } from "@chakra-ui/react";

import { Card } from "../Card";
import { VerifyModal } from "../VerifyModal";
import { DoneToastContent } from "../DoneToastContent";

import { PROVIDER_ID, Stamp } from "@gitcoin/passport-types";

const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

const providerId: PROVIDER_ID = "POAP";

export default function PoapCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [poapVerified, SetPoapVerified] = useState<boolean | undefined>(undefined);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  // --- Chakra functions
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // fetch an example VC from the IAM server
  const handleFetchCredential = (): void => {
    datadogLogs.logger.info("Saving Stamp", { provider: providerId });
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
      .then((verified: { error?: string; record: any; credential: any }): void => {
        SetPoapVerified(!verified.error);
        SetCredentialResponse({
          provider: "POAP",
          credential: verified.credential,
        });
      })
      .catch((e: any): void => {
        datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
        datadogRum.addError(e, { provider: providerId });
      })
      .finally((): void => {
        setCredentialResponseIsLoading(false);
      });
  };

  const handleUserVerify = (): void => {
    handleAddStamp(credentialResponse!)
      .then(() => datadogLogs.logger.info("Successfully saved Stamp", { provider: providerId }))
      .catch((e: any): void => {
        datadogLogs.logger.error(`error saving stamp: ${e}`, { provider: providerId });
      })
      .finally(() => {
        setVerificationInProgress(false);
      });
    onClose();
    // Custom Success Toast
    toast({
      duration: 5000,
      isClosable: true,
      render: (result: any) => <DoneToastContent providerId={providerId} result={result} />,
    });
  };

  const handleModalOnClose = (): void => {
    setVerificationInProgress(false);
    onClose();
  };

  const successModalText = (
    <>
      <Text fontSize="md">
        We checked for POAP badges and found at least one POAP badge that is 15 or more days old.
      </Text>
    </>
  );

  const failModalText = (
    <>
      <Text fontSize="md">We checked for POAP badges and did not find POAP badge(s) that are 15 or more days old.</Text>
    </>
  );

  const title = poapVerified ? "POAP Stamp Verification" : "POAP Not Found";

  // We only need a custom footor in the case of failure
  const footer = poapVerified ? undefined : (
    <ModalFooter py={3}>
      <Button data-testid="modal-cancel" variant="outline" mr={5} onClick={handleModalOnClose}>
        Cancel
      </Button>
      <Button
        data-testid="modal-verify"
        colorScheme="purple"
        mr={2}
        onClick={() => {
          window.open("https://poap.xyz", "_blank");
        }}
      >
        Go to POAP
      </Button>
    </ModalFooter>
  );

  const issueCredentialWidget = (
    <>
      <button
        className="verify-btn"
        data-testid="button-verify-poap"
        onClick={() => {
          setVerificationInProgress(true);
          SetCredentialResponse(undefined);
          handleFetchCredential();
          onOpen();
        }}
      >
        Connect to POAP
      </button>
      <VerifyModal
        isOpen={isOpen}
        onClose={handleModalOnClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={<>{poapVerified ? successModalText : failModalText}</>}
        title={title}
        isLoading={credentialResponseIsLoading}
        footer={footer}
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
