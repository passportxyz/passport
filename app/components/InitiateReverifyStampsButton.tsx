/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useState } from "react";

// --- Style Components
import { Button } from "./Button";
import { CeramicContext, platforms } from "../context/ceramicContext";
import { Modal, ModalContent, ModalOverlay, useToast } from "@chakra-ui/react";
import { DoneToastContent } from "./DoneToastContent";
import { STAMP_PROVIDERS } from "../config/providers";
import { getProviderIdsFromPlatformId } from "./ExpiredStampModal";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { LoadButton } from "./LoadButton";
import { getPlatformSpec } from "../config/platforms";
// -- Utils
import { StampClaimForPlatform, StampClaimingContext } from "../context/stampClaimingContext";

export type ExpiredStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ReverifyStampsModal = ({ isOpen, onClose }: ExpiredStampModalProps) => {
  const { expiredProviders } = useContext(CeramicContext);
  const [isReverifyingStamps, setIsReverifyingStamps] = useState(false);
  const { claimCredentials } = useContext(StampClaimingContext);
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

  const handleClaimStep = async (
    step: number, // Index in the for
    status: string, // "wait_confirmation" | "in_progress" | "all_done"
    ) => {
      
  }

  const reverifyStamps = async () => {
    setIsReverifyingStamps(true);

    let stampClaims: StampClaimForPlatform[] = [];
    let evmStampClaim: StampClaimForPlatform = {
      platformId: "EVMBulkVerify",
      selectedProviders: [],
    };

    Object.keys(STAMP_PROVIDERS).forEach((_platformId) => {
      const platformId = _platformId as PLATFORM_ID;
      const possibleProviders = getProviderIdsFromPlatformId(platformId);
      const expiredProvidersInPlatform = possibleProviders.filter((provider) => expiredProviders.includes(provider));

      const platform = platforms.get(platformId)?.platform;

      if (expiredProvidersInPlatform.length > 0) {
        if (platform?.isEVM) {
          evmStampClaim.selectedProviders = [...expiredProvidersInPlatform, ...evmStampClaim.selectedProviders];
        } else {
          stampClaims.push({ platformId: platformId, selectedProviders: expiredProvidersInPlatform });
        }
      }
    });

    await claimCredentials([handleClaimStep, evmStampClaim,  ...stampClaims]);

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
            <Button variant="secondary">
              Next
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
