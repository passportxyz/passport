import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import Progress, { Status, Step } from "./Progress";

export type RefreshStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const RefreshStampModal = ({ isOpen, onClose }: RefreshStampModalProps) => {
  const { handleRefreshPassport } = useContext(CeramicContext);

  const [currentSteps, setCurrentSteps] = useState<Step[]>([
    {
      name: "Connecting",
      description: "Connecting to Ceramic...",
      status: Status.IS_SUCCESS,
    },
    {
      name: "Resetting",
      description: "Returning Passport to the last stable state...",
      status: Status.NOT_STARTED,
    },
  ]);

  const updateSteps = (activeStepIndex: number, error?: boolean) => {
    // if error mark ActiveStep as IS_ERROR, and previous steps as IS_SUCCESS
    const steps = [...currentSteps];
    if (error) {
      steps[activeStepIndex].status = Status.IS_ERROR;
      steps.slice(0, activeStepIndex).forEach((step) => (step.status = Status.IS_SUCCESS));
      setCurrentSteps(steps);
      return;
    }

    // if there is no error mark previous steps as IS_SUCCESS, mark step after activeStepIndex as IS_STARTED
    steps.slice(0, activeStepIndex).forEach((step) => (step.status = Status.IS_SUCCESS));
    if (steps[activeStepIndex]) {
      steps[activeStepIndex].status = Status.IN_PROGRESS;
    }

    setCurrentSteps(steps);
  };

  useEffect(() => {
    const refreshPassportState = async () => {
      updateSteps(1);
      const refreshedState = await (await handleRefreshPassport()).filter((state: boolean) => !state);
      console.log({ refreshedState });
      if (refreshedState.length > 0) {
        updateSteps(2, true);
      } else {
        updateSteps(2);
      }
    };
    refreshPassportState();
  }, [handleRefreshPassport]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} blockScrollOnMount={false}>
      <ModalOverlay />
      <ModalContent>
        <div className="m-4">
          <p className="font-semibold">Resetting</p>
          <p>
            Please wait while we repair some parts of your Passport on the Ceramic side. This may take up to 5
            minutes...
          </p>
          <Progress steps={currentSteps} />
        </div>
      </ModalContent>
    </Modal>
  );
};
