// --- React Methods
import React, { useContext, useEffect, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- pull context
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

// --- import components
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
  CredentialResponseBody,
  PLATFORM_ID,
  PROVIDER_ID,
  Stamp,
  VerifiableCredential,
  VerifiableCredentialRecord,
} from "@gitcoin/passport-types";
import { STAMP_PROVIDERS } from "../../config/providers";
import { VerificationResponse, WorldIDWidget } from "@worldcoin/id";
import { SideBarContent } from "../SideBarContent";
import { getPlatformSpec } from "../../config/platforms";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const platformId: PLATFORM_ID = "WorldID";
const actionId = "wid_5047fd9af3d4a665da9a44251270d6b2"; // Remember to change actionId in `iam/src/providers/worldid.ts`

export default function WorldIDPlatform(): JSX.Element {
  const { handleAddStamps, allProvidersState } = useContext(CeramicContext);
  const { address, signer } = useContext(UserContext);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const toast = useToast();

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

  const handleFetchCredential = (worldIDProof: VerificationResponse): void => {
    datadogLogs.logger.info("starting provider verification", { platform: platformId });
    setLoading(true);

    fetchVerifiableCredential(
      iamUrl,
      {
        type: platformId,
        types: selectedProviders,
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
      .then(async (verified: VerifiableCredentialRecord): Promise<void> => {
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
        // close modal
        onClose();
        // Custom Success Toast
        toast({
          duration: 5000,
          isClosable: true,
          render: (result: any) => <DoneToastContent platformId={platformId} result={result} />,
        });
      })
      .catch((e: any): void => {
        datadogLogs.logger.error("Verification Error", { error: e, platform: platformId });
        datadogRum.addError(`Error ${e}`, { platform: platformId });
        setSelectedProviders([]);
      })
      .finally((): void => {
        setLoading(false);
      });
  };

  // Widget displays steps to verify passport with World ID
  const worldIDVerificationWidget = (
    <div>
      <p className="mt-2">
        World ID lets you anonymously prove you are a unique person.{" "}
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
          If you don&apos;t have your World ID yet, download the{" "}
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
            onClick={() => onOpen()}
            data-testid="button-verify-world-id"
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
                    {"Verify World ID Stamp Data"}
                  </ModalHeader>
                  <ModalCloseButton mr={2} />
                  <ModalBody p={0}>
                    <div className="px-8 pb-4 text-gray-500">
                      {/* RSX Element passed in to show desired stamp output */}
                      {worldIDVerificationWidget}
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
