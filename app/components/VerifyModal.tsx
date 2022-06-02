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

import { Stamp } from "@dpopp/types";

export type VerifyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  handleUserVerify: () => void;
  stamp: Stamp | undefined;
  verifyData?: JSX.Element;
  isLoading: boolean;
};

export const VerifyModal = ({
  isOpen,
  onClose,
  handleUserVerify,
  stamp,
  verifyData,
  isLoading,
}: VerifyModalProps): JSX.Element => {
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
            <ModalHeader className="text-center">Verify {stamp?.provider} Stamp Data</ModalHeader>

            <ModalCloseButton />
            <ModalBody>
              {/* RSX Element passed in to show desired stamp output */}
              {verifyData}
              <br />
              <br />
              {stamp && (
                <Accordion defaultIndex={[0]} allowMultiple>
                  <AccordionItem>
                    <h2>
                      <AccordionButton borderColor={"white"}>
                        <Box flex="1" textAlign="left">
                          Your Stamp Credential
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <div className="text-sm">{JSON.stringify(stamp, undefined, 4)}</div>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}
            </ModalBody>

            {stamp && (
              <ModalFooter>
                <Button data-testid="modal-cancel" colorScheme="red" mr={3} onClick={onClose}>
                  Cancel
                </Button>
                <Button data-testid="modal-verify" colorScheme="purple" mr={3} onClick={handleUserVerify}>
                  Verify
                </Button>
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
