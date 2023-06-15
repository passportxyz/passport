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

export type RemoveStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  closeButtonText?: string;
  stampsToBeDeleted?: PROVIDER_ID[];
  handleDeleteStamps: Function;
  platformId: PLATFORM_ID;
};

export const RemoveStampModal = ({
  isOpen,
  onClose,
  title,
  body,
  closeButtonText,
  stampsToBeDeleted,
  handleDeleteStamps,
  platformId,
}: RemoveStampModalProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleStampRemoval = async () => {
    try {
      setIsLoading(true);
      await handleDeleteStamps(stampsToBeDeleted);
      toast({
        duration: 900000,
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
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay width="100%" height="100%" />
      <ModalContent
        rounded={"none"}
        padding={5}
        maxW={{
          sm: "100%",
          md: "600px",
        }}
        maxH="80%"
      >
        <ModalHeader>
          <img alt="shield alert" src="../assets/shield-alert.svg" className="m-auto mb-4 w-10" />
          <p className="text-center">{title}</p>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody color="#757087" className="mb-10 overflow-auto text-center">
          {body}
        </ModalBody>

        <div className="grid grid-cols-2 gap-4">
          <Button data-testid="button-stamp-removal-cancel" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <LoadButton data-testid="button-stamp-removal" onClick={handleStampRemoval} isLoading={isLoading}>
            {isLoading ? "Removing..." : closeButtonText || "Remove Stamp"}
          </LoadButton>
        </div>
      </ModalContent>
    </Modal>
  );
};
