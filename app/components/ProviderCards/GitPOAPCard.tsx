// --- React Methods
import React, { useContext, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// pull context
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

// --- Chakra Elements
import { ModalFooter, Button, useDisclosure, Text, useToast } from "@chakra-ui/react";

import { Card } from "../Card";
import { VerifyModal } from "../VerifyModal";
import { DoneToastContent } from "../DoneToastContent";

import { PROVIDER_ID, Stamp } from "@gitcoin/passport-types";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

const providerId: PROVIDER_ID = "GitPOAP";

export default function GitPOAPCard(): JSX.Element {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamp, allProvidersState } = useContext(CeramicContext);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [credentialResponse, setCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [gitpoapVerified, setGitPOAPVerified] = useState<boolean | undefined>(undefined);
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
        setGitPOAPVerified(!verified.error);
        setCredentialResponse({
          provider: "GitPOAP",
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
    datadogLogs.logger.info("Saving Stamp", { provider: providerId });
    handleAddStamp(credentialResponse!)
      .then(() => datadogLogs.logger.info("Successfully saved Stamp", { provider: providerId }))
      .catch((e: any): void => {
        datadogLogs.logger.error("Error Saving Stamp", { error: e, provider: providerId });
        datadogRum.addError(e, { provider: providerId });
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
        We checked for GitPOAP badges and found at least one GitPOAP badge that is 15 or more days old.
      </Text>
    </>
  );

  const failModalText = (
    <>
      <Text fontSize="md">
        We checked for GitPOAP badges and did not find GitPOAP badge(s) that are 15 or more days old.
      </Text>
    </>
  );

  // We only need a custom footer in the case of failure
  const footer = gitpoapVerified ? undefined : (
    <ModalFooter py={3}>
      <Button variant="outline" mr={5} onClick={handleModalOnClose}>
        Cancel
      </Button>
      <Button
        colorScheme="blue"
        mr={2}
        onClick={() => {
          window.open("https://gitpoap.io", "_blank");
        }}
      >
        Go to GitPOAP
      </Button>
    </ModalFooter>
  );

  const issueCredentialWidget = (
    <>
      <button
        className="verify-btn"
        data-testid="button-verify-gitpoap"
        onClick={() => {
          setVerificationInProgress(true);
          setCredentialResponse(undefined);
          handleFetchCredential();
          onOpen();
        }}
      >
        Connect to GitPOAP
      </button>
      <VerifyModal
        title={gitpoapVerified ? "GitPOAP Stamp Verification" : "GitPOAP Not Found"}
        isOpen={isOpen}
        onClose={handleModalOnClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={<>{gitpoapVerified ? successModalText : failModalText}</>}
        isLoading={credentialResponseIsLoading}
        footer={footer}
      />
    </>
  );

  return (
    <Card
      streamId={allProvidersState[providerId]!.stamp?.streamId}
      providerSpec={allProvidersState[providerId]!.providerSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
      isLoading={verificationInProgress}
    />
  );
}
