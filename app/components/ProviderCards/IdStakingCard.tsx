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

import { PROVIDER_ID, Stamp } from "@gitcoin/passport-types";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

// --- import components
import { Card } from "../Card";
import { VerifyModal } from "../VerifyModal";
import { useDisclosure, useToast, ModalFooter, Button } from "@chakra-ui/react";
import { DoneToastContent } from "../DoneToastContent";

const providerId: PROVIDER_ID = "IdStaking";

export default function IdStakingCard(): JSX.Element {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamp, allProvidersState } = useContext(CeramicContext);
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [stakingAmount, setStakingAmount] = useState<string | undefined>(undefined);
  const [stakingVerified, SetStakingVerified] = useState<boolean | undefined>(undefined);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  // --- Chakra functions
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleFetchCredential = (): void => {
    datadogLogs.logger.info("Starting verification", { provider: providerId });
    setCredentialResponseIsLoading(true);
    fetchVerifiableCredential(
      iamUrl,
      {
        type: "IdStaking",
        version: "0.0.0",
        address: address || "",
        proofs: {
          valid: address ? "true" : "false",
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified: { error?: string; record: any; credential: any }): void => {
        setStakingAmount(verified.record?.stakeAmount);
        SetStakingVerified(!verified.error);
        SetCredentialResponse({
          provider: "IdStaking",
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
      .catch((e) => {
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

  // We only need a custom footor in the case of failure
  const footer = stakingVerified ? undefined : (
    <ModalFooter py={3}>
      <Button variant="outline" mr={5} onClick={handleModalOnClose}>
        Cancel
      </Button>
      <Button
        colorScheme="purple"
        mr={2}
        onClick={() => {
          window.open("https://neighborly-engine.surge.sh/", "_blank");
        }}
      >
        Go Stake
      </Button>
    </ModalFooter>
  );

  const issueCredentialWidget = (
    <>
      <button
        data-testid="button-verify-idstaking"
        className="verify-btn"
        onClick={() => {
          setVerificationInProgress(true);
          SetCredentialResponse(undefined);
          handleFetchCredential();
          onOpen();
        }}
      >
        Verify Stake
      </button>
      <VerifyModal
        title={stakingVerified ? "Verify Staked Amount" : "Valid Staked Amount Not Found"}
        isOpen={isOpen}
        onClose={handleModalOnClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={<>{`The Amount you staked is ${stakingAmount || "0.0"} GTC`}</>}
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
