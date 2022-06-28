import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
} from "@chakra-ui/react";

type JsonOutputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subheading: string;
  jsonOutput: any;
  closeButtonText?: string;
};

export const JsonOutputModal = ({
  isOpen,
  onClose,
  title,
  subheading,
  jsonOutput,
  closeButtonText,
}: JsonOutputModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent rounded={"none"} padding={4} maxW="80%" maxH="80%">
        <ModalHeader borderBottomWidth={2} borderBottomColor={"gray.200"}>
          <p className="font-miriam-libre">{title}</p>
          <p className="font-miriam-libre text-base font-normal">{subheading}</p>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody className="font-miriam-libre overflow-auto">
          <pre>{JSON.stringify(jsonOutput, null, "\t")}</pre>
        </ModalBody>

        <ModalFooter borderTopWidth={2} borderTopColor={"gray.200"}>
          <Button
            data-testid="button-passport-json-done"
            width={24}
            rounded={"base"}
            colorScheme="purple"
            mr={3}
            onClick={onClose}
          >
            <span className="font-miriam-libre">{closeButtonText || "Done"}</span>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
