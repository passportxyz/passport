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
  ModalFooter,
  Button,
} from "@chakra-ui/react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

export type JsonOutputModalProps = {
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
  const onDownload = () => {
    const filename = "passport.json";
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonOutput, null, "\t"))
    );
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();
    document.body.removeChild(element);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        rounded={"none"}
        padding={4}
        maxW="80%"
        maxH="80%"
        background="var(--color-background-2)"
        textColor="var(--color-text)"
        border="solid 1px var(--color-accent-2)"
      >
        <ModalHeader borderBottomWidth={2} borderBottomColor="var(--color-accent2)">
          <p className="text-color-1">{title}</p>
          <p className="text-base text-color-1">{subheading}</p>
        </ModalHeader>
        <ModalCloseButton color="var(--color-text-1)" />
        <ModalBody className="overflow-auto text-color-4">
          <pre data-testid="passport-json">{JSON.stringify(jsonOutput, null, "\t")}</pre>
        </ModalBody>

        <ModalFooter borderTopWidth={2} borderTopColor="var(--color-accent2)">
          <Button
            data-testid="button-passport-json-download"
            width={32}
            rounded={"base"}
            mr={3}
            onClick={onDownload}
            variant="outline"
            borderColor="var(--color-accent2)"
            _hover={{ bg: "var(--color-accent1)" }}
          >
            <ArrowDownTrayIcon fill="var(--color-text-1)" />
            &nbsp;
            <span className="text-color-1">{"Download"}</span>
          </Button>
          <Button
            data-testid="button-passport-json-done"
            width={24}
            rounded={"base"}
            colorScheme="purple"
            mr={3}
            onClick={onClose}
          >
            <span>{closeButtonText || "Done"}</span>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
