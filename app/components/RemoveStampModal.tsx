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
  Stack,
  Button,
  useToast,
} from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

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
    setIsLoading(true);
    await handleDeleteStamps(stampsToBeDeleted);
    toast({
      duration: 5000,
      isClosable: true,
      render: (result: any) => (
        <DoneToastContent
          title="Success!"
          body="Stamp data has been removed."
          icon="../assets/check-icon.svg"
          result={result}
        />
      ),
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay width="100%" height="100%" />
      <ModalContent
        rounded={"none"}
        padding={5}
        maxW={{
          sm: "100%",
          md: "55%",
          xl: "45%",
        }}
        maxH="80%"
      >
        <ModalHeader>
          <img src="../assets/shieldAlert.svg" className="m-auto mb-4 w-10" />
          <p className="font-miriam-libre text-center">{title}</p>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody color="#757087" className="font-miriam-libre mb-10 overflow-auto text-center">
          {body}
        </ModalBody>

        <Stack direction={["column", "row"]} align="center">
          <Button
            data-testid="button-stamp-removal-cancel"
            width="50%"
            rounded={"base"}
            onClick={onClose}
            backgroundColor="#fff"
            borderWidth={1}
            borderColor="#e6e4e9"
          >
            <span className="font-miriam-libre">{"Cancel"}</span>
          </Button>
          <Button
            data-testid="button-stamp-removal"
            width="50%"
            rounded={"base"}
            colorScheme="purple"
            onClick={handleStampRemoval}
            isLoading={isLoading}
            loadingText="Removing Stamp"
            className="font-miriam-libre"
          >
            <span className="font-miriam-libre">{closeButtonText || "Remove Stamp"}</span>
          </Button>
        </Stack>
      </ModalContent>
    </Modal>
  );
};
