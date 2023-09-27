/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useState } from "react";

// --- Style Components
import { Button } from "./Button";
import { CeramicContext, evmTypeProviders, platforms } from "../context/ceramicContext";
import { Modal, ModalContent, ModalOverlay, useToast } from "@chakra-ui/react";
import { DoneToastContent } from "./DoneToastContent";
import { STAMP_PROVIDERS } from "../config/providers";
import { getProviderIdsFromPlatformId } from "./ExpiredStampModal";
import { PLATFORM_ID, PROVIDER_ID, Stamp, VerifiableCredentialRecord } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import { LoadButton } from "./LoadButton";
import { getPlatformSpec } from "../config/platforms";
// -- Utils
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";
import { reduceStampResponse } from "../utils/helpers";
import { UserContext } from "../context/userContext";
import { StampClaimingContext } from "./GenericPlatform";

export type ExpiredStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ReverifyStampsModal = ({ isOpen, onClose }: ExpiredStampModalProps) => {
  const { expiredProviders, handleDeleteStamps, handleAddStamps } = useContext(CeramicContext);
  const [isReverifyingStamps, setIsReverifyingStamps] = useState(false);
  const { address, signer } = useContext(UserContext);
  const { handleFetchCredential } = useContext(StampClaimingContext);
  const toast = useToast();

  const successToast = () => {
    toast({
      duration: 9000,
      isClosable: true,
      render: (result: any) => (
        <DoneToastContent
          title="Success"
          message="Your expired stamps have been reverified."
          icon="./assets/check-icon2.svg"
          result={result}
        />
      ),
    });
  };

  const expiredPlatforms = Object.keys(STAMP_PROVIDERS).filter((provider) => {
    const possibleProviders = getProviderIdsFromPlatformId(provider as PLATFORM_ID);
    return possibleProviders.filter((provider) => expiredProviders.includes(provider)).length > 0;
  });

  // const handleFetchCredential = async (providerIDs: PROVIDER_ID[]): Promise<void> => {
  //   const { evmProviders, nonEvmProviders } = providerIDs.reduce(
  //     (acc, provider) => {
  //       if (evmTypeProviders.has(provider)) {
  //         acc.evmProviders.push(provider);
  //       } else {
  //         acc.nonEvmProviders.push(provider);
  //       }
  //       return acc;
  //     },
  //     {
  //       evmProviders: [] as PROVIDER_ID[],
  //       nonEvmProviders: [] as PROVIDER_ID[],
  //     }
  //   );

  //   console.log("geri evmProviders", evmProviders);
  //   console.log("geri nonEvmProviders", nonEvmProviders);

  //   try {
  //     if (evmProviders.length > 0 && false) {
  //       const verified: VerifiableCredentialRecord = await fetchVerifiableCredential(
  //         iamUrl,
  //         {
  //           type: "EVMBulkVerify",
  //           types: evmProviders,
  //           version: "0.0.0",
  //           address: address || "",
  //           proofs: {},
  //           signatureType: IAM_SIGNATURE_TYPE,
  //         },
  //         signer as { signMessage: (message: string) => Promise<string> }
  //       );

  //       const vcs = reduceStampResponse(providerIDs, verified.credentials);

  //       // Delete all stamps ...
  //       await handleDeleteStamps(providerIDs as PROVIDER_ID[]);

  //       // .. and now add all newly validate stamps
  //       if (vcs.length > 0) {
  //         await handleAddStamps(vcs);
  //       }

  //       // grab all providers who are verified from the verify response
  //       // const actualVerifiedProviders = providerIDs.filter(
  //       //   (providerId) =>
  //       //     !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
  //       // );
  //       // both verified and selected should look the same after save
  //       // setVerifiedProviders([...actualVerifiedProviders]);
  //       // setSelectedProviders([...actualVerifiedProviders]);
  //     }

  //     if (nonEvmProviders.length > 1) {
  //     }
  //   } catch (e: unknown) {
  //     // TODO: update datadog logger
  //     // datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
  //     console.log(e);
  //     throw new Error();
  //   }
  // };

  const reverifyStamps = async () => {
    setIsReverifyingStamps(true);

    const stampsToReverify = expiredPlatforms.flatMap((platform) =>
      getProviderIdsFromPlatformId(platform as PLATFORM_ID)
    );

    console.log("geri - expiredPlatforms", expiredPlatforms);

    const expiredPlatformsGroups = Object.keys(STAMP_PROVIDERS).reduce(
      (acc, platformId) => {
        const possibleProviders = getProviderIdsFromPlatformId(platformId as PLATFORM_ID);
        const expiredProvidersInPlatform = possibleProviders.filter((provider) => expiredProviders.includes(provider));

        // const providersToClaim = platformGroups[platformId as PLATFORM_ID].providers;
        const platform = platforms.get(platformId as PLATFORM_ID)?.platform;

        if (expiredProvidersInPlatform.length > 0) {
          if (platform?.isEVM) {
            acc["EVMBulkVerify"] = { providers: expiredProvidersInPlatform };
          } else {
            acc[platformId as PLATFORM_ID] = { providers: expiredProvidersInPlatform };
          }
        }
        return acc;
      },
      {
        EVMBulkVerify: { providers: [] as PROVIDER_ID[] },
      } as Record<PLATFORM_ID, { providers: PROVIDER_ID[] }> & { EVMBulkVerify: { providers: PROVIDER_ID[] } }
    );

    console.log("geri - expiredPlatformsGroups: ", expiredPlatformsGroups);
    const { evmProviders, nonEvmProviders } = stampsToReverify.reduce(
      (acc, provider) => {
        if (evmTypeProviders.has(provider)) {
          acc.evmProviders.push(provider);
        } else {
          acc.nonEvmProviders.push(provider);
        }
        return acc;
      },
      {
        evmProviders: [] as PROVIDER_ID[],
        nonEvmProviders: [] as PROVIDER_ID[],
      }
    );

    console.log("geri evmProviders", evmProviders);
    console.log("geri nonEvmProviders", nonEvmProviders);

    await handleFetchCredential(expiredPlatformsGroups);

    setIsReverifyingStamps(false);
    onClose();
    successToast();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} blockScrollOnMount={false}>
      <ModalOverlay />
      <ModalContent>
        <div className="m-3 flex flex-col items-center">
          <div className="mt-2 w-fit rounded-full bg-pink-500/25">
            <img className="m-2" alt="shield-exclamation-icon" src="./assets/shield-exclamation-icon-warning.svg" />
          </div>
          <p className="m-1 text-sm font-bold">Refresh Expired Stamps</p>
          <p className="m-1 mb-4 text-center">These expired stamps will be refreshed in your Passport.</p>
          <a
            className="mb-1 text-center text-sm text-blue-600 underline"
            href="https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/common-questions/why-have-my-stamps-expired"
            target="_blank"
            rel="noopener noreferrer"
          >
            Why have my stamps expired?
          </a>
          <p className="w-full text-left text-sm font-semibold text-gray-600">Stamps</p>
          <hr className="border-1 w-full" />
          {expiredPlatforms.map((platform) => {
            const spec = getPlatformSpec(platform as PLATFORM_ID);
            return (
              <div key={spec?.name} className="w-full">
                <div className="flex w-full items-center justify-start">
                  <img width="25px" alt="Platform Image" src={spec?.icon} className="m-3" />
                  <p className="text-sm font-semibold">{spec?.name}</p>
                </div>
                <hr className="border-1 w-full" />
              </div>
            );
          })}
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <LoadButton data-testid="delete-duplicate" onClick={reverifyStamps} isLoading={isReverifyingStamps}>
              Reverify Stamps
            </LoadButton>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

const InitiateReverifyStampsButton = ({ className }: { className?: string }) => {
  const [showExpiredStampsModal, setShowExpiredStampsModal] = useState<boolean>(false);

  return (
    <>
      <Button className={`${className}`} onClick={() => setShowExpiredStampsModal(true)}>
        Reverify stamps
      </Button>
      {showExpiredStampsModal && <ReverifyStampsModal isOpen={true} onClose={() => setShowExpiredStampsModal(false)} />}
    </>
  );
};

export default InitiateReverifyStampsButton;
