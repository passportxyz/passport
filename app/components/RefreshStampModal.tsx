import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { Progress, completedIcon, Status, Step } from "./Progress";
import { useToast } from "@chakra-ui/react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

export type RefreshStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const RefreshStampModal = ({ isOpen, onClose }: RefreshStampModalProps) => {
  const { handleCheckRefreshPassport, userDid } = useContext(CeramicContext);
  const [resetError, setResetError] = useState<boolean>(false);
  const toast = useToast();

  const [currentSteps, setCurrentSteps] = useState<Step[]>([
    {
      name: "Connecting",
      description: "Connecting to Ceramic...",
      status: Status.SUCCESS,
    },
    {
      name: "Resetting",
      description: "Returning Passport to the last stable state...",
      status: Status.NOT_STARTED,
    },
  ]);

  const updateSteps = (activeStepIndex: number, error?: boolean) => {
    // if error mark ActiveStep as ERROR, and previous steps as SUCCESS
    const steps = [...currentSteps];
    if (error) {
      steps.slice(0, activeStepIndex).forEach((step) => (step.status = Status.SUCCESS));
      steps[activeStepIndex - 1].status = Status.ERROR;
      setCurrentSteps(steps);
      return;
    }
    // if there is no error mark previous steps as SUCCESS, mark step after activeStepIndex as IS_STARTED
    steps.slice(0, activeStepIndex).forEach((step) => (step.status = Status.SUCCESS));
    if (steps[activeStepIndex]) {
      steps[activeStepIndex].status = Status.IN_PROGRESS;
    }

    setCurrentSteps(steps);
  };

  const successToast = () => {
    toast({
      duration: 5000,
      isClosable: true,
      render: (result: any) => (
        <div className="flex justify-between rounded-md bg-blue-darkblue p-4 text-white">
          {completedIcon("./assets/purple-check-icon.svg")}
          <p className="py-1 px-3">Your Passport has been reset.</p>
          <button className="sticky top-0" onClick={result.onClose}>
            <img alt="close button" className="rounded-lg hover:bg-gray-500" src="./assets/x-icon.svg" />
          </button>
        </div>
      ),
    });
  };

  const refreshPassportState = async () => {
    try {
      updateSteps(1);
      datadogLogs.logger.info(`RefreshStampModal - calling handleCheckRefreshPassport for did=${userDid}`, {
        did: userDid,
      });
      const refreshSuccess = await handleCheckRefreshPassport();
      // If errors were found while refreshing they won't be filtered out
      if (!refreshSuccess) {
        datadogLogs.logger.error(
          `RefreshStampModal - calling handleCheckRefreshPassport was not successfull for did=${userDid}`,
          { did: userDid }
        );
        // handleCheckRefreshPassport returned an error after polling ceramic
        updateSteps(2, true);
        // show error status in progress bar for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setResetError(true);
      } else {
        datadogLogs.logger.info(
          `RefreshStampModal - calling handleCheckRefreshPassport was successfull for did=${userDid}`,
          { did: userDid }
        );
        updateSteps(2);
        // Wait 2 seconds to show success toast
        await new Promise((resolve) => setTimeout(resolve, 2000));

        onClose();

        // Show success toast
        successToast();
      }
    } catch (error) {
      updateSteps(2, true);
    }
  };

  useEffect(() => {
    refreshPassportState();
  }, []);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} blockScrollOnMount={false}>
        <ModalOverlay />
        <ModalContent>
          {resetError ? (
            <div className="m-4">
              <div className="flex w-full justify-center">
                <div className="mt-2 w-fit rounded-full bg-pink-500/25">
                  <img
                    className="m-2"
                    alt="shield-exclamation-icon"
                    src="./assets/shield-exclamation-icon-warning.svg"
                  />
                </div>
              </div>
              <p className="m-1 text-center text-sm font-bold">Reset Failed</p>
              <p className="m-1 mb-4 text-center">
                We could not reset your Passport at the moment. Please try again or contact our support team.
              </p>

              <div className="flex w-full">
                <a
                  href="https://support.gitcoin.co/gitcoin-knowledge-base/misc/contact-us"
                  target="_blank"
                  className="m-1 w-1/2 items-center rounded-md border py-2  text-center"
                  rel="noreferrer"
                >
                  Contact Support
                </a>
                <button
                  data-testid="check-other-wallet"
                  className="m-1 mx-auto flex w-1/2 justify-center rounded-md bg-purple-connectPurple py-2 text-white hover:bg-purple-200 hover:text-black"
                  onClick={() => {
                    setResetError(false);
                    refreshPassportState();
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="m-4">
              <p className="m-2 font-semibold">Resetting</p>
              <p className="m-2">
                Please wait while we repair some parts of your Passport. This may take up to 5 minutes...
              </p>
              <Progress steps={currentSteps} />
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
