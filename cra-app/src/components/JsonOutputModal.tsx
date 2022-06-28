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
      <ModalContent rounded={"none"} padding={4} maxW="80%" maxH="80%">
        <ModalHeader borderBottomWidth={2} borderBottomColor={"gray.200"}>
          <p className="font-miriam-libre">{title}</p>
          <p className="font-miriam-libre text-base font-normal">{subheading}</p>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody className="font-miriam-libre overflow-auto">
          <pre data-testid="passport-json">{JSON.stringify(jsonOutput, null, "\t")}</pre>
        </ModalBody>

        <ModalFooter borderTopWidth={2} borderTopColor={"gray.200"}>
          <Button data-testid="button-passport-json-download" width={32} rounded={"base"} mr={3} onClick={onDownload}>
            <span>
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0 15C-2.41411e-08 14.4477 0.447715 14 1 14H13C13.5523 14 14 14.4477 14 15C14 15.5523 13.5523 16 13 16H1C0.447715 16 2.41411e-08 15.5523 0 15ZM3.29289 7.29289C3.68342 6.90237 4.31658 6.90237 4.70711 7.29289L6 8.58579L6 1C6 0.447716 6.44771 2.41411e-08 7 0C7.55228 -2.41411e-08 8 0.447715 8 1L8 8.58579L9.29289 7.29289C9.68342 6.90237 10.3166 6.90237 10.7071 7.29289C11.0976 7.68342 11.0976 8.31658 10.7071 8.70711L7.70711 11.7071C7.51957 11.8946 7.26522 12 7 12C6.73478 12 6.48043 11.8946 6.29289 11.7071L3.29289 8.70711C2.90237 8.31658 2.90237 7.68342 3.29289 7.29289Z"
                  fill="#111827"
                />
              </svg>
            </span>
            &nbsp;
            <span className="font-miriam-libre">{"Download"}</span>
          </Button>
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
