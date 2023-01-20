import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { Progress, completedIcon, Status, Step } from "./Progress";
import { useToast } from "@chakra-ui/react";

export type RefreshStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const RefreshStampModal = ({ isOpen, onClose }: RefreshStampModalProps) => {
  const { handleCheckRefreshPassport } = useContext(CeramicContext);
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

  useEffect(() => {
    const refreshPassportState = async () => {
      try {
        updateSteps(1);
        const refreshedState = await (await handleCheckRefreshPassport()).filter((state: boolean) => !state);
        if (refreshedState.length > 0) {
          // handleCheckRefreshPassport returned an error after polling ceramic
          updateSteps(2, true);
        } else {
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
    refreshPassportState();
  }, []);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} blockScrollOnMount={false}>
        <ModalOverlay />
        <ModalContent>
          <div className="m-4">
            <p className="m-2 font-semibold">Resetting</p>
            <p className="m-2">
              Please wait while we repair some parts of your Passport. This may take up to 5 minutes...
            </p>
            <Progress steps={currentSteps} />
          </div>
        </ModalContent>
      </Modal>
    </>
  );
};
