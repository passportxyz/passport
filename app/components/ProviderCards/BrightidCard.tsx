// --- React Methods
import React, { useContext, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- pull context
import { UserContext } from "../../context/userContext";

// --- Verification step tools
import QRCode from "react-qr-code";

// --- import components
import { Card } from "../Card";
import { DoneToastContent } from "../DoneToastContent";
import { VerifyModal } from "../VerifyModal";
import { useDisclosure, useToast } from "@chakra-ui/react";

// ---- Types
import { PROVIDER_ID, Stamp } from "@gitcoin/passport-types";
import { ProviderSpec } from "../../config/providers";

const iamUrl = process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "";

const providerId: PROVIDER_ID = "Brightid";

type BrightIdProviderRecord = {
  context?: string;
  contextId?: string;
  meets?: string;
};

export default function BrightIdCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState, userDid } = useContext(UserContext);
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [brightIdVerification, SetBrightIdVerification] = useState<BrightIdProviderRecord | undefined>(undefined);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  // --- Chakra functions
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleFetchCredential = (): void => {
    datadogLogs.logger.info("starting provider verification", { provider: providerId });
    setCredentialResponseIsLoading(true);
    fetchVerifiableCredential(
      iamUrl,
      {
        type: "Brightid",
        version: "0.0.0",
        address: address || "",
        proofs: {
          did: userDid || "",
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then((verified: { record: any; credential: any }): void => {
        SetBrightIdVerification(verified.record);
        SetCredentialResponse({
          provider: "Brightid",
          credential: verified.credential,
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

  async function handleSponsorship(): Promise<void> {
    datadogLogs.logger.info("Sponsoring user on BrightId", { provider: providerId });
    setCredentialResponseIsLoading(true);
    const res = fetch(`${process.env.NEXT_PUBLIC_DPOPP_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/sponsor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contextIdData: userDid,
      }),
    });
    const data = await (await res).json();
    if (data?.response?.result?.status === "success") {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result) => (
          <div className="rounded-md bg-blue-darkblue p-2 text-white">
            <div className="flex p-4">
              <button className="inline-flex flex-shrink-0 cursor-not-allowed">
                <img
                  alt="information circle"
                  className="sticky top-0 mb-20 p-2"
                  src="./assets/information-circle-icon.svg"
                />
              </button>
              <div className="flex-grow pl-6">
                <h2 className="title-font mb-2 text-lg font-bold">Sponsored through Gitcoin for Bright ID</h2>
                <p className="text-base leading-relaxed">{`For verification status updates, check BrightID's App.`}</p>
                <p className="text-base leading-relaxed">
                  Once you are verified by BrightID - return here to complete this Stamp.
                </p>
              </div>
              <button className="inline-flex flex-shrink-0 rounded-lg" onClick={result.onClose}>
                <img alt="close button" className="rounded-lg p-2 hover:bg-gray-500" src="./assets/x-icon.svg" />
              </button>
            </div>
          </div>
        ),
      });
      datadogLogs.logger.info("Successfully sponsored user on BrightId", { provider: providerId });
    } else {
      toast({
        title: "Failure",
        description: "Failed to trigger BrightID Sponsorship",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      datadogLogs.logger.error("Error sponsoring user", { provider: providerId });
      datadogRum.addError(data?.response?.error || "Failed to sponsor user on BrightId", { provider: providerId });
    }
    setCredentialResponseIsLoading(false);
    setVerificationInProgress(false);
    onClose();
  }

  async function handleVerifyContextId(): Promise<boolean> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_DPOPP_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/verifyContextId`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contextIdData: userDid,
        }),
      }
    );
    const data = await (await res).json();
    return data?.response?.valid;
  }

  // triggers on modal verification click
  const handleUserVerify = (): void => {
    datadogLogs.logger.info("Saving Stamp", { provider: providerId });
    handleAddStamp(credentialResponse!)
      .then(() => datadogLogs.logger.info("Successfully saved Stamp", { provider: providerId }))
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

  // Widget displays steps to verify BrightID with Gitcoin
  const brightIdSponsorshipWidget = (
    <div>
      <p className="mt-2">
        Bright ID is a social identity network that allows you to prove that you’re only using one account.{" "}
        <a
          className="text-purple-connectPurple underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.brightid.org/"
        >
          Learn More
        </a>
        .
      </p>
      {userDid ? (
        <div>
          <br />
          <h1>To collect an Identity Stamp from Bright ID, please complete the following steps.</h1>
          <br />
          <div>
            <div data-testid="brightid-modal-step1">1) Download the Bright ID App on your mobile device</div>
            <div className="-mt-4 flex flex-wrap">
              <div className="w-1/2 px-4">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://play.google.com/store/apps/details?id=org.brightid"
                >
                  <img
                    alt="content"
                    className="mt-4 rounded-lg object-center p-2"
                    src="./assets/google-play-logo.svg"
                  />
                </a>
              </div>
              <div className="w-1/2 px-4">
                <a target="_blank" rel="noopener noreferrer" href="https://apps.apple.com/us/app/brightid/id1428946820">
                  <img alt="content" className="rounded-lg object-center p-2" src="./assets/apple-appstore-logo.svg" />
                </a>
              </div>
            </div>
            <div className="-mt-4">
              2) Link Bright ID to Gitcoin by scanning this QR code from the Bright ID app, or clicking{" "}
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-connectPurple underline"
                href={`https://app.brightid.org/link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${userDid}`}
              >
                here
              </a>{" "}
              from your mobile device.
              <br />
              <br />
              <div style={{ height: "auto", margin: "auto", maxWidth: 300, width: "100%" }}>
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={`brightid://link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${userDid}`}
                />
              </div>
            </div>
            <p className="mb-2">3) Click Connect Bright ID to get sponsored by Gitcoin.</p>
            <p className="mb-2">
              {`Once you are linked, sponsored, and have attended a connection party to complete your verification* on
              BrightID's App - return to this Stamp to finish the verification.`}
            </p>
            <p>* Please note that it may take some time for Bright ID to complete this process</p>{" "}
            <div className="mb-10 w-full justify-center object-center p-4">
              <button
                data-testid="button-sponsor-brightid"
                className="float-right mx-auto rounded-md bg-blue-darkblue py-2 px-2 text-white"
                onClick={async () => await handleSponsorship()}
              >
                <span className="font-miriam-libre">Connect Bright ID</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2">Refresh Browser and Try Again</div>
      )}
    </div>
  );

  const issueCredentialWidget = (
    <>
      <button
        data-testid="button-verify-brightid"
        className="verify-btn"
        onClick={async () => {
          setVerificationInProgress(true);
          SetCredentialResponse(undefined);
          SetBrightIdVerification(undefined);
          // primary check to see if users did is verified
          const isVerified = await handleVerifyContextId();
          if (isVerified) {
            handleFetchCredential();
          }
          onOpen();
        }}
      >
        Connect Account
      </button>
      <VerifyModal
        title="Verify Bright ID Stamp Data"
        isOpen={isOpen}
        onClose={handleModalOnClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={
          <>
            {brightIdVerification
              ? `Your BrightId has been verified on ${brightIdVerification.context}`
              : brightIdSponsorshipWidget}
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
      isLoading={verificationInProgress}
    />
  );
}
