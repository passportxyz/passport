// --- React Methods
import React, { useContext, useState, useEffect } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- pull context
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

// --- Platform definitions
import { getPlatformSpec } from "../../config/platforms";
import { STAMP_PROVIDERS } from "../../config/providers";

// --- Verification step tools
import QRCode from "react-qr-code";

// --- import components
import { SideBarContent } from "../SideBarContent";
import { DoneToastContent } from "../DoneToastContent";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  useToast,
  Spinner,
} from "@chakra-ui/react";

// ---- Types
import {
  PROVIDER_ID,
  Stamp,
  VerifiableCredential,
  VerifiableCredentialRecord,
  PLATFORM_ID,
  CredentialResponseBody,
} from "@gitcoin/passport-types";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

// Each provider is recognised by its ID
const platformId: PLATFORM_ID = "Brightid";

type BrightIdProviderRecord = {
  context?: string;
  contextId?: string;
  meets?: string;
};

export default function BrightidPlatform(): JSX.Element {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamps, allProvidersState, userDid } = useContext(CeramicContext);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  // find all providerIds
  const providerIds =
    STAMP_PROVIDERS["Brightid"]?.reduce((all, stamp) => {
      return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
    }, [] as PROVIDER_ID[]) || [];

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>(
    providerIds.filter((providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined")
  );
  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  // any time we change selection state...
  useEffect(() => {
    if (selectedProviders.length !== verifiedProviders.length) {
      setCanSubmit(true);
    }
  }, [selectedProviders, verifiedProviders]);

  // --- Chakra functions
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleFetchCredential = (): void => {
    datadogLogs.logger.info("starting provider verification", { platform: platformId });
    setLoading(true);
    fetchVerifiableCredential(
      iamUrl,
      {
        type: platformId,
        types: selectedProviders,
        version: "0.0.0",
        address: address || "",
        proofs: {
          did: userDid || "",
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then(async (verified: VerifiableCredentialRecord): void => {
        // because we provided a types array in the params we expect to receive a credentials array in the response...
        const vcs =
          verified.credentials
            ?.map((cred: CredentialResponseBody): Stamp | undefined => {
              if (!cred.error) {
                // add each of the requested/received stamps to the passport...
                return {
                  provider: cred.record?.type as PROVIDER_ID,
                  credential: cred.credential as VerifiableCredential,
                };
              }
            })
            .filter((v: Stamp | undefined) => v) || [];
        // Add all the stamps to the passport at once
        await handleAddStamps(vcs as Stamp[]);
        datadogLogs.logger.info("Successfully saved Stamp", { platform: platformId });
        // grab all providers who are verified from the verify response
        const actualVerifiedProviders = providerIds.filter(
          (providerId) =>
            !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
        );
        // both verified and selected should look the same after save
        setVerifiedProviders([...actualVerifiedProviders]);
        setSelectedProviders([...actualVerifiedProviders]);
        // reset can submit state
        setCanSubmit(false);
        // Custom Success Toast
        toast({
          duration: 5000,
          isClosable: true,
          render: (result: any) => <DoneToastContent platformId={platformId} result={result} />,
        });
      })
      .catch((e: any): void => {
        datadogLogs.logger.error("Verification Error", { error: e, platformId: platformId });
        datadogRum.addError(`Error ${e}`, { platformId: platformId });
      })
      .finally((): void => {
        setLoading(false);
      });
  };

  async function handleSponsorship(): Promise<void> {
    datadogLogs.logger.info("Sponsoring user on BrightId", { platformId: platformId });
    const res = fetch(`${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/sponsor`, {
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
      datadogLogs.logger.info("Successfully sponsored user on BrightId", { platformId: platformId });
    } else {
      toast({
        title: "Failure",
        description: "Failed to trigger BrightID Sponsorship",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      datadogLogs.logger.error("Error sponsoring user", { platformId: platformId });
      datadogRum.addError(data?.response?.error || "Failed to sponsor user on BrightId", { platformId: platformId });
    }
    onClose();
  }

  async function handleVerifyContextId(): Promise<boolean> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(/\/*?$/, "")}/brightid/verifyContextId`,
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

  return (
    <SideBarContent
      currentPlatform={getPlatformSpec(platformId)}
      currentProviders={STAMP_PROVIDERS[platformId]}
      verifiedProviders={verifiedProviders}
      selectedProviders={selectedProviders}
      setSelectedProviders={setSelectedProviders}
      isLoading={isLoading}
      verifyButton={
        <>
          <button
            disabled={!canSubmit}
            onClick={async () => {
              setVerificationInProgress(true);
              // primary check to see if users did is verified
              const isVerified = await handleVerifyContextId();
              if (isVerified) {
                handleFetchCredential();
              } else {
                // uncheck the switch after this connection modal shows
                setSelectedProviders([]);
                onOpen();
              }
            }}
            data-testid="button-verify-brightid"
            className="sidebar-verify-btn"
          >
            Verify
          </button>

          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              {isLoading ? (
                <div className="p-20 text-center">
                  <Spinner data-testid="loading-spinner" />
                </div>
              ) : (
                <>
                  <ModalHeader px={8} pb={1} pt={6} textAlign="center">
                    {"Verify Bright ID Stamp Data"}
                  </ModalHeader>
                  <ModalCloseButton mr={2} />
                  <ModalBody p={0}>
                    <div className="px-8 pb-4 text-gray-500">
                      {/* RSX Element passed in to show desired stamp output */}
                      {brightIdSponsorshipWidget}
                    </div>
                  </ModalBody>
                </>
              )}
            </ModalContent>
          </Modal>
        </>
      }
    />
  );
}
