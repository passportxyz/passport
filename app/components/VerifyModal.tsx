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
  Spinner,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";

import { Stamp } from "@gitcoin/passport-types";

export type VerifyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  handleUserVerify: () => void;
  stamp: Stamp | undefined;
  verifyData?: JSX.Element;
  isLoading: boolean;
  title?: string;
  footer?: JSX.Element;
};

export const VerifyModal = ({
  isOpen,
  onClose,
  handleUserVerify,
  stamp,
  verifyData,
  isLoading,
  title,
  footer,
}: VerifyModalProps): JSX.Element => {
  const modalTitle = title || `Verify ${stamp?.provider} Stamp Data`;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        {isLoading ? (
          <div className="p-20 text-center">
            <Spinner data-testid="loading-spinner" />
          </div>
        ) : (
          <>
            <ModalHeader px={8} pb={1} pt={6} textAlign="center">
              {modalTitle}
            </ModalHeader>
            <ModalCloseButton mr={2} />
            <ModalBody p={0}>
              <div className="px-8 pb-4 text-gray-500">
                {/* RSX Element passed in to show desired stamp output */}
                {verifyData}
              </div>
              {stamp && (
                <Accordion defaultIndex={[]} allowMultiple>
                  <AccordionItem>
                    <h2 className="my-6 mx-8 rounded border">
                      <AccordionButton>
                        <Box flex="1" textAlign="left" textColor="gray.600">
                          Your Stamp Credential
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel px={8} pb={4}>
                      <div className="overflow-auto text-sm text-gray-500">
                        <pre>{JSON.stringify(stamp, undefined, 2)}</pre>
                      </div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}
            </ModalBody>

            {footer ||
              (stamp && (
                <ModalFooter py={3}>
                  <Button data-testid="modal-cancel" variant="outline" mr={5} onClick={onClose}>
                    Cancel
                  </Button>
                  <Button data-testid="modal-verify" colorScheme="purple" mr={2} onClick={handleUserVerify}>
                    Verify
                  </Button>
                </ModalFooter>
              ))}
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
