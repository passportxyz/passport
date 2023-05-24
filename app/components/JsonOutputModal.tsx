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
} from "@chakra-ui/react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { Button } from "./Button";

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
      <ModalContent rounded={"none"} padding={4} maxW="80%" maxH="80%" textColor="inherit">
        <ModalHeader borderBottomWidth={2} borderBottomColor="var(--color-accent2)">
          <p className="text-color-1">{title}</p>
          <p className="text-base text-color-1">{subheading}</p>
        </ModalHeader>
        <ModalCloseButton color="var(--color-text-1)" />
        <ModalBody className="overflow-auto text-color-4">
          <pre data-testid="passport-json">{JSON.stringify(jsonOutput, null, "\t")}</pre>
        </ModalBody>

        <ModalFooter borderTopWidth={2} borderTopColor="var(--color-accent2)">
          <Button data-testid="button-passport-json-download" onClick={onDownload} variant="secondary">
            <ArrowDownTrayIcon fill="var(--color-text-1)" width={16} />
            Download
          </Button>
          <Button data-testid="button-passport-json-done" onClick={onClose} className="ml-4">
            {closeButtonText || "Done"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
