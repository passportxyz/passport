// --- React Methods
import React from "react";

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
} from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

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
  const handleStampRemoval = () => {
    handleDeleteStamps(stampsToBeDeleted);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent rounded={"none"} padding={4} maxW="80%" maxH="80%">
        <ModalHeader borderBottomWidth={2} borderBottomColor={"gray.200"}>
          <p className="font-miriam-libre">{title}</p>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody className="font-miriam-libre overflow-auto">{body}</ModalBody>

        <Stack borderTopWidth={2} borderTopColor={"gray.200"}>
          <Button data-testid="button-stamp-removal-cancel" width="50%" rounded={"base"} mr={3} onClick={onClose}>
            <span className="font-miriam-libre">{"Cancel"}</span>
          </Button>
          <Button
            data-testid="button-stamp-removal"
            width="50%"
            rounded={"base"}
            mr={3}
            colorScheme="purple"
            onClick={handleStampRemoval}
          >
            <span className="font-miriam-libre">{closeButtonText || "Remove Stamp"}</span>
          </Button>
        </Stack>
      </ModalContent>
    </Modal>
  );
};
