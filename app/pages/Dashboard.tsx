/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// --Components
import { CardList } from "../components/CardList";

// --Chakra UI Elements
import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
} from "@chakra-ui/react";

import { UserContext } from "../context/userContext";

export default function Dashboard() {
  const { handleConnection, address, walletLabel, passport, isLoadingPassport, handleCreatePassport, wallet } =
    useContext(UserContext);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (!wallet) {
      navigate("/");
    }
  }, [wallet]);

  useEffect(() => {
    if (!passport && !isLoadingPassport) {
      handleCreatePassport();
    }
  }, [passport, isLoadingPassport]);

  return (
    <div className="font-miriam-libre min-h-max min-h-default text-gray-100">
      <div className="container mx-auto px-5 py-2">
        <div className="mx-auto flex flex-wrap">
          <div className="mb-6 w-full py-6">
            <div className="font-miriam-libre text-gray-050 mt-10 leading-relaxed">
              {/* Top Avatar and Address */}
              <div className="mx-auto flex flex-col items-center py-10 sm:flex-row">
                <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white text-indigo-500 sm:mr-10">
                  <img src="./assets/GitcoinLogo.svg" alt="Gitcoin Logo White" />
                </div>
                <div className="mt-6 flex-grow text-center sm:mt-0 sm:text-left">
                  <h2 className="title-font mb-2 text-2xl font-medium text-black">dPassport</h2>
                </div>

                {!passport ? (
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="purple.500"
                    size="xl"
                    data-testid="loading-spinner-passport"
                  />
                ) : (
                  <div className="mb-10 mt-10 md:w-1/4">
                    <button
                      data-testid="button-passport-json"
                      className="rounded-md border-2 border-gray-300 py-2 px-4 text-black"
                      onClick={onOpen}
                    >{`</> Passport JSON`}</button>

                    <Modal isOpen={isOpen} onClose={onClose}>
                      <ModalOverlay />
                      <ModalContent>
                        <ModalHeader>
                          {" "}
                          <p className="font-miriam-libre">Passport JSON</p>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                          <Accordion allowMultiple backgroundColor={"white"}>
                            <AccordionItem>
                              <h2>
                                <AccordionButton>
                                  <Box flex="1" textAlign="left" className="font-miriam-libre">
                                    You can find the Passport JSON data below
                                  </Box>
                                  <AccordionIcon />
                                </AccordionButton>
                              </h2>
                              <AccordionPanel pb={4}>
                                <AccordionPanel pb={4} className="font-miriam-libre">
                                  {JSON.stringify(passport, undefined, 4)}
                                </AccordionPanel>
                              </AccordionPanel>
                            </AccordionItem>
                          </Accordion>
                        </ModalBody>

                        <ModalFooter>
                          <Button
                            data-testid="button-passport-json-done"
                            rounded={"md"}
                            colorScheme="purple"
                            mr={3}
                            onClick={onClose}
                          >
                            <span className="font-miriam-libre">Done</span>
                          </Button>
                        </ModalFooter>
                      </ModalContent>
                    </Modal>
                  </div>
                )}
              </div>

              <p className="mb-4 text-2xl text-black">Decentralized Identity Verification</p>
              <p className="text-xl text-black">
                Select the verification stamps you’d like to connect to your Passport.
              </p>
            </div>
            {/* VCs */}
            <div className="mx-auto flex flex-col items-center py-10">
              <CardList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
