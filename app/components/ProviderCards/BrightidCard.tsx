// --- React Methods
import React, { useContext, useState } from "react";

// --- Identity tools
import { fetchVerifiableCredential } from "@dpopp/identity";

// --- pull context
import { UserContext } from "../../context/userContext";

// --- Verification step tools
import QRCode from "react-qr-code";

// --- import components
import { Card } from "../Card";
import { VerifyModal } from "../VerifyModal";
import { useDisclosure, Button, useToast } from "@chakra-ui/react";

// ---- Types
import { PROVIDER_ID, Stamp, BrightIdProcedureResponse } from "@dpopp/types";
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [brightIdVerification, SetBrightIdVerification] = useState<BrightIdProviderRecord | undefined>(undefined);
  const toast = useToast();
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  const handleFetchCredential = (): void => {
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
      .catch((e: any): void => {})
      .finally((): void => {
        setCredentialResponseIsLoading(false);
      });
  };

  async function handleSponsorship(): Promise<void> {
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
        title: "Success",
        description: "Successfully triggered BrightID Sponsorship. Come back to Passport to Verify.",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Failure",
        description: "Failed to trigger BrightID Sponsorship",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    setCredentialResponseIsLoading(false);
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
    const result: BrightIdProcedureResponse = await res.json();
    return result.valid;
  }

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

  // Widget displays steps to verify BrightID with Gitcoin
  const brightIdSponsorshipWidget = (
    <div>
      <h1 className="text-center text-xl font-bold">BrightID</h1>
      {userDid ? (
        <div>
          <br />
          <h1>A verifiable credential was not generated for your address. Follow the steps below to qualify:</h1>
          <br />
          <div>
            <div>1) Download the BrightID App on your mobile device</div>
            <div className="flex flex-wrap p-4">
              <div className="mb-10 px-4 sm:w-1/2">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://play.google.com/store/apps/details?id=org.brightid"
                >
                  <img
                    alt="content"
                    className="h-16 w-16 rounded-lg object-center p-2 hover:bg-gray-200"
                    src="./assets/appAndroid.svg"
                  />
                </a>
              </div>
              <div className="mb-2 px-4 sm:w-1/2">
                <a target="_blank" rel="noopener noreferrer" href="https://apps.apple.com/us/app/brightid/id1428946820">
                  <img
                    alt="content"
                    className="h-16 w-16 rounded-lg object-center p-2 hover:bg-gray-200"
                    src="./assets/appApple.svg"
                  />
                </a>
              </div>
            </div>
            <div>
              2) Connect BrightID to Gitcoin by scanning this QR code from the BrightID app, or clicking{" "}
              <a
                className="text-purple-connectPurple underline"
                href={`https://app.brightid.org/link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${encodeURIComponent(
                  userDid
                )}`}
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
                  value={`brightid://link-verification/http:%2f%2fnode.brightid.org/Gitcoin/${encodeURIComponent(
                    userDid
                  )}`}
                />
              </div>
            </div>

            <button
              data-testid="button-sponsor-brightid"
              className="float-right mx-auto rounded-md bg-purple-connectPurple py-2 px-2 text-white"
              onClick={async () => await handleSponsorship()}
            >
              <span className="font-miriam-libre">Connect BrightID</span>
            </button>
          </div>
        </div>
      ) : (
        <div>Refresh Browser and Try Again</div>
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
