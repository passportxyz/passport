// --- React Methods
import React, { useContext, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- pull context
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

// --- import components
import { Card } from "../Card";
import { DoneToastContent } from "../DoneToastContent";
import { VerifyModal } from "../VerifyModal";
import { useDisclosure, useToast } from "@chakra-ui/react";

// ---- Types
import { PROVIDER_ID, Stamp, VerifiableCredential, VerifiableCredentialRecord } from "@gitcoin/passport-types";
import { ProviderSpec } from "../../config/providers";
import { VerificationResponse, WorldIDWidget } from "@worldcoin/id";

const providerId: PROVIDER_ID = "WorldID";
const actionId = "wid_staging_f03ce20272cf13e445a963c91a5695ea";

export default function WorldIDCard(): JSX.Element {
  const { handleAddStamp, allProvidersState } = useContext(CeramicContext);
  const { address, signer } = useContext(UserContext);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [credentialResponse, setCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const worldIDVerification = null;
  const toast = useToast();

  // --- Chakra functions
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleFetchCredential = (worldIDProof: VerificationResponse): void => {
    datadogLogs.logger.info("starting provider verification", { provider: providerId });
    setCredentialResponseIsLoading(true);
    fetchVerifiableCredential(
      process.env.NEXT_PUBLIC_PASSPORT_IAM_URL ?? "",
      {
        type: providerId,
        version: "0.0.0",
        address: address ?? "",
        proofs: {
          proof: worldIDProof.proof,
          nullifier_hash: worldIDProof.nullifier_hash,
          merkle_root: worldIDProof.merkle_root,
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified: VerifiableCredentialRecord): void => {
        setCredentialResponse({
          provider: providerId,
          credential: verified.credential as VerifiableCredential,
        });
      })
      .catch((e: any): void => {
        datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
        datadogRum.addError(`Error ${e}`, { provider: providerId });
      })
      .finally((): void => {
        setCredentialResponseIsLoading(false);
      });
  };

  const handleUserVerify = (): void => {
    datadogLogs.logger.info("Saving Stamp", { provider: providerId });
    handleAddStamp(credentialResponse!)
      .then(() => datadogLogs.logger.info("Successfully Saved Stamp", { provider: providerId }))
      .catch((e): void => {
        datadogLogs.logger.error("Error Saving Stamp", { error: e, provider: providerId });
        datadogRum.addError(e, { provider: providerId });
        throw e;
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

  // Widget displays steps to verify passport with World ID
  const worldIDVerificationWidget = (
    <div>
      <p className="mt-2">
        World ID proves you are a unique person doing something only once.{" "}
        <a
          className="text-purple-connectPurple underline"
          target="_blank"
          rel="noreferrer noopener"
          href="https://worldcoin.org/"
        >
          Learn More
        </a>
        .
      </p>
      <div>
        <h1 className="mt-4">To collect an Identity Stamp from World ID, please tap the World ID widget below.</h1>
        <br />

        <div className="flex justify-center">
          <WorldIDWidget signal={address} actionId={actionId} onSuccess={handleFetchCredential} />
        </div>

        <h2 className="mt-4">
          If you don&apos;t have World ID yet, download the{" "}
          <a
            className="text-purple-connectPurple underline"
            href="https://worldcoin.org/download"
            rel="noreferrer noopener"
            target="_blank"
          >
            Worldcoin app
          </a>{" "}
          and visit an orb.
        </h2>
      </div>
    </div>
  );

  const issueCredentialWidget = (
    <>
      <button
        data-testid="button-verify-brightid"
        className="verify-btn"
        onClick={async () => {
          setVerificationInProgress(true);
          onOpen();
        }}
      >
        Connect anonymously
      </button>
      <VerifyModal
        title="Verify World ID Stamp Data"
        isOpen={isOpen}
        onClose={handleModalOnClose}
        handleUserVerify={() => {}} // Method is unused; the modal is no longer shown if the credential is issued
        stamp={undefined}
        verifyData={
          <>
            {worldIDVerification
              ? `Your passport has been verified with World ID on ${worldIDVerification}`
              : worldIDVerificationWidget}
          </>
        }
        isLoading={credentialResponseIsLoading}
      />
    </>
  );

  return (
    <Card
      streamId={allProvidersState[providerId]!.stamp?.streamId}
      providerSpec={allProvidersState[providerId]!.providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
      isLoading={verificationInProgress}
    />
  );
}
