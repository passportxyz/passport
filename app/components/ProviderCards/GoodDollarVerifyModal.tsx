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
  ModalFooter,
  Button,
  Spinner,
  Box,
  ButtonGroup,
  OrderedList,
  ListItem,
  ListIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Text,
} from "@chakra-ui/react";

import { Stamp } from "@gitcoin/passport-types";

// --- GoodDollar
import { useFVLink } from "@gooddollar/web3sdk-v2";

export type VerifyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  stamp: Stamp | undefined;
  isLoading: boolean;
};

export const GoodDollarVerifyModal = ({ isOpen, onClose, stamp, isLoading }: VerifyModalProps): JSX.Element => {
  const [doneSteps, setDoneSteps] = useState({ step1: false, step2: false, step3: false });
  const fvlink = useFVLink();

  const modalTitle = `GoodDollar Liveness and Uniqueness Verification`;
  const step1 = async () => {
    await fvlink.getLoginSig();
    doneSteps.step1 = true;
    setDoneSteps({ ...doneSteps });
  };
  const step2 = async () => {
    await fvlink.getFvSig();
    doneSteps.step2 = true;
    setDoneSteps({ ...doneSteps });
  };
  const step3 = async () => {
    const link = await fvlink.getLink("", window.location.href + "?verified=true", false);
    window.location.assign(link);
    doneSteps.step3 = true;
    setDoneSteps({ ...doneSteps });
  };
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
                <Text>To get verify follow the following steps:</Text>
                <OrderedList spacing={3}>
                  <ListItem>Sign to login to GoodDollar</ListItem>
                  <ListItem>Sign your unique anonymized identifier</ListItem>
                  <ListItem>Perform face verification</ListItem>
                </OrderedList>
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
              <Box display="flex" alignItems="center" justifyContent="center" width="100%" py={6}>
                <ButtonGroup>
                  <Button
                    data-testid="modal-verify"
                    colorScheme="purple"
                    mr={2}
                    onClick={step1}
                    disabled={doneSteps.step1}
                  >
                    1. Sign Login
                  </Button>
                  <Button
                    data-testid="modal-verify"
                    colorScheme="purple"
                    mr={2}
                    onClick={step2}
                    disabled={doneSteps.step2 || !doneSteps.step1}
                  >
                    2. Sign Identifier
                  </Button>
                  <Button
                    data-testid="modal-verify"
                    colorScheme="purple"
                    mr={2}
                    onClick={step3}
                    disabled={doneSteps.step3 || !doneSteps.step2}
                  >
                    3. Verify
                  </Button>
                </ButtonGroup>
              </Box>
            </ModalBody>

            <ModalFooter py={3}>
              <Button data-testid="modal-cancel" variant="outline" mr={5} onClick={onClose}>
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
