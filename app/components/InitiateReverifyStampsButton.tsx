/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useState } from "react";

// --- Style Components
import { Button } from "./Button";
import { CeramicContext } from "../context/ceramicContext";
import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { LoadButton } from "./LoadButton";
import { usePlatforms } from "../hooks/usePlatforms";
// -- Utils
import { StampClaimForPlatform, StampClaimingContext } from "../context/stampClaimingContext";
import { Hyperlink } from "@gitcoin/passport-platforms";
import { useMessage } from "../hooks/useMessage";

export type ExpiredStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type WaitCondition = {
  doContinue: () => void;
};

export const ReverifyStampsModal = ({ isOpen, onClose }: ExpiredStampModalProps) => {
  const { expiredProviders } = useContext(CeramicContext);
  const { claimCredentials, status } = useContext(StampClaimingContext);
  const [waitForNext, setWaitForNext] = useState<WaitCondition>();
  const [isReverifyingStamps, setIsReverifyingStamps] = useState(false);
  const { getPlatformSpec, platformProviderIds, platforms } = usePlatforms();

  const { success, failure } = useMessage();

  const successToast = () => {
    success({
      title: "Success",
      message: "Your expired Stamps have been reverified.",
    });
  };

  const errorToast = (platform: string) => {
    failure({
      title: "Error",
      message: `Failed to reverify Stamps for ${platform}. Please double check eligibility and try again.`,
    });
  };

  const expiredPlatforms = Array.from(platforms.keys()).filter((platform) => {
    const possibleProviders = platformProviderIds[platform];
    return possibleProviders.filter((provider) => expiredProviders.includes(provider)).length > 0;
  });

  const handleClaimStep = async (step: number): Promise<void> => {
    if (status !== "in_progress") {
      if (step == 0) {
        // We do not wait on the first step, the user has to click next only
        // before getting to the next one
        return;
      }

      return new Promise<void>((resolve) => {
        setWaitForNext({ doContinue: resolve });
      });
    }
  };

  const indicateError = (platform: PLATFORM_ID | "EVMBulkVerify") => errorToast(platform);

  const reverifyStamps = async () => {
    setIsReverifyingStamps(true);

    let stampClaims: StampClaimForPlatform[] = [];
    let evmStampClaim: StampClaimForPlatform = {
      platformId: "EVMBulkVerify",
      selectedProviders: [],
    };

    Array.from(platforms.keys()).forEach((platformId) => {
      const possibleProviders = platformProviderIds[platformId];
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

    await claimCredentials(handleClaimStep, indicateError, [evmStampClaim, ...stampClaims]);

    setIsReverifyingStamps(false);
    onClose();
    successToast();
  };

  const handleNextClick = () => {
    if (waitForNext) {
      waitForNext.doContinue();
    }
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
          <Hyperlink
            className="mb-1 text-sm"
            href="https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/common-questions/why-have-my-stamps-expired"
          >
            Why have my stamps expired?
          </Hyperlink>
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
            {!isReverifyingStamps && status !== "in_progress" ? (
              <LoadButton data-testid="reverify-initial-button" onClick={reverifyStamps}>
                Reverify Stamps
              </LoadButton>
            ) : (
              <LoadButton
                data-testid="reverify-next-button"
                onClick={handleNextClick}
                isLoading={status === "in_progress"}
              >
                Next
              </LoadButton>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export const InitiateReverifyStampsButton = ({ className }: { className?: string }) => {
  const [showExpiredStampsModal, setShowExpiredStampsModal] = useState<boolean>(false);

  const handleClose = () => {
    setShowExpiredStampsModal(false);
  };

  const handleOpen = () => {
    setShowExpiredStampsModal(true);
  };

  return (
    <>
      <Button data-testid="reverify-button" className={`${className}`} onClick={handleOpen}>
        Reverify stamps
      </Button>
      {showExpiredStampsModal && <ReverifyStampsModal isOpen={true} onClose={handleClose} />}
    </>
  );
};

export default InitiateReverifyStampsButton;
