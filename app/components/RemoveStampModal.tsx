// --- React Methods
import React, { useState } from "react";

// --- Chakra Elements
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useToast,
} from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { Button } from "./Button";
import { LoadButton } from "./LoadButton";

// --- Style Components
import { DoneToastContent } from "./DoneToastContent";
import { ActionOrCancelModal } from "./ActionOrCancelModal";
import { useChakraPortalWorkaround } from "../hooks/useChakraPortalWorkaround";

export type RemoveStampModalProps = {
  isOpen: boolean;
  onClose: (result?: any) => void;
  title: string;
  body: string;
  stampsToBeDeleted?: PROVIDER_ID[];
  handleDeleteStamps: Function;
  platformId: PLATFORM_ID;
};

export const RemoveStampModal = ({
  isOpen,
  onClose,
  title,
  body,
  stampsToBeDeleted,
  handleDeleteStamps,
}: RemoveStampModalProps): JSX.Element => {
  useChakraPortalWorkaround();

  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleStampRemoval = async () => {
    try {
      setIsLoading(true);
      await handleDeleteStamps(stampsToBeDeleted);
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title="Success!"
            message="Stamp data has been removed."
            icon="../assets/check-icon2.svg"
            result={result}
          />
        ),
      });
    } catch (error) {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title="Error!"
            message="Something went wrong. Please try again."
            icon="../assets/verification-failed-bright.svg"
            result={result}
          />
        ),
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ActionOrCancelModal
      title={
        <>
          <img alt="shield alert" src="../assets/shield-alert.svg" className="m-auto mb-4 w-10" />
          <p className="text-center">{title}</p>
        </>
      }
      buttonText={isLoading ? "Removing..." : "Remove Stamp"}
      onButtonClick={handleStampRemoval}
      isOpen={isOpen}
      onClose={onClose}
      buttonLoading={isLoading}
    >
      {body}
    </ActionOrCancelModal>
  );
};
