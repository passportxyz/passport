import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { Progress, completedIcon, Status, Step } from "./Progress";
import { useToast } from "@chakra-ui/react";

import { PlatformProps } from "../components/GenericPlatform";
import { PlatformGroupSpec } from "../config/providers";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

export type RefreshMyStampsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// This modal looks for any web3 stamps the user has not yet claimed

export const RefreshMyStampsModal = ({ isOpen, onClose }: RefreshMyStampsModalProps) => {
  const [currentSteps, setCurrentSteps] = useState<Step[]>([
    {
      name: "Scanning",
      status: Status.SUCCESS,
    },
    {
      name: "Double Checking",
      status: Status.NOT_STARTED,
    },
    {
      name: "Validating",
      status: Status.NOT_STARTED,
    },
    {
      name: "Brewing Coffee",
      status: Status.NOT_STARTED,
    },
    {
      name: "Almost there",
      status: Status.NOT_STARTED,
    },
    {
      name: "Ready for review",
      status: Status.NOT_STARTED,
    },
  ]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={true} isCentered>
        <ModalOverlay />
        <ModalContent
          rounded={"none"}
          padding={5}
          w="410px"
          h="550px"
          backgroundColor="black"
          borderWidth="1px"
          borderColor="#234E52"
        >
          <div className="text-3xl text-white">Searching for Stamps</div>
          <div className="mt-2 text-white">Give us a moment while we check your account for existing Stamps.</div>
          <div className="mt-2 text-white">***Stamp refresh progess bar***</div>
          <div className="mt-6 text-center text-white">Please do not close the window.</div>
        </ModalContent>
      </Modal>
    </>
  );
};
