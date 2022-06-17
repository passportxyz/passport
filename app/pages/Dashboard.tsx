/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// --Components
import { CardList } from "../components/CardList";
import { JsonOutputModal } from "../components/JsonOutputModal";

// --Chakra UI Elements
import {
  Spinner,
  useDisclosure,
  Alert,
  AlertTitle,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
} from "@chakra-ui/react";

import { UserContext } from "../context/userContext";

import { useViewerConnection } from "@self.id/framework";
import { EthereumAuthProvider } from "@self.id/web";

export default function Dashboard() {
  const { passport, wallet, isLoadingPassport, handleConnection } = useContext(UserContext);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();

  const [viewerConnection, ceramicConnect] = useViewerConnection();
  const { isOpen: retryModalIsOpen, onOpen: onRetryModalOpen, onClose: onRetryModalClose } = useDisclosure();

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (!wallet) {
      navigate("/");
    }
  }, [wallet]);

  // Allow user to retry Ceramic connection if failed
  const retryConnection = () => {
    if (isLoadingPassport == undefined && wallet) {
      ceramicConnect(new EthereumAuthProvider(wallet.provider, wallet.accounts[0].address));
      onRetryModalClose();
    }
  };

  const closeModalAndDisconnect = () => {
    onRetryModalClose();
    // toggle wallet connect/disconnect
    handleConnection();
  };

  // isLoadingPassport undefined when there is an issue during fetchPassport attempt
  useEffect(() => {
    if (isLoadingPassport == undefined) {
      onRetryModalOpen();
    }
  }, [isLoadingPassport]);

  const retryModal = (
    <Modal isOpen={retryModalIsOpen} onClose={onRetryModalClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody mt={4}>
          <div className="flex flex-row">
            <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 sm:mr-10">
              <img alt="shield-exclamation-icon" src="./assets/shield-exclamation-icon.svg" />
            </div>
            <div className="flex flex-col" data-testid="retry-modal-content">
              <p className="text-lg font-bold">Unable to Connect</p>
              <p>
                There was an issue connecting to the Ceramic network. You can try connecting again or try again later.
              </p>
            </div>
          </div>
        </ModalBody>
        {
          <ModalFooter py={3}>
            <Button data-testid="retry-modal-try-again" variant="outline" mr={2} onClick={retryConnection}>
              Try Again
            </Button>
            <Button data-testid="retry-modal-close" colorScheme="purple" onClick={closeModalAndDisconnect}>
              Done
            </Button>
          </ModalFooter>
        }
      </ModalContent>
    </Modal>
  );

  return (
    <>
      <div className="flex w-full flex-col flex-wrap border-b-2 p-5 md:flex-row">
        <div className="float-right mb-4 flex flex-row items-center font-medium text-gray-900 md:mb-0">
          <img src="/assets/gitcoinLogoDark.svg" alt="Gitcoin Logo" />
          <img className="ml-6 mr-6" src="/assets/logoLine.svg" alt="Logo Line" />
          <img src="/assets/passportLogoBlack.svg" alt="pPassport Logo" />
        </div>
      </div>

      <div className="mt-6 flex w-full flex-wrap px-10">
        <div className="w-3/4">
          <p className="mb-4 text-2xl text-black">Decentralized Identity Verification</p>
          <p className="text-xl text-black">Select the verification stamps you’d like to connect to your Passport.</p>
        </div>
        <div className="w-full md:w-1/4">
          {isLoadingPassport == undefined && retryModal}
          {viewerConnection.status === "connecting" && (
            <Alert status="warning" data-testid="selfId-connection-alert">
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="orange.500" size="md" />
              <AlertTitle ml={4}> Waiting for wallet signature</AlertTitle>
            </Alert>
          )}
          {viewerConnection.status !== "connecting" &&
            (!passport ? (
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="purple.500"
                size="xl"
                data-testid="loading-spinner-passport"
              />
            ) : (
              <div>
                <button
                  data-testid="button-passport-json"
                  className="float-right rounded-md border-2 border-gray-300 py-2 px-6 text-black"
                  onClick={onOpen}
                >{`</> Passport JSON`}</button>

                <JsonOutputModal
                  isOpen={isOpen}
                  onClose={onClose}
                  title={"Passport JSON"}
                  subheading={"You can find the Passport JSON data below"}
                  jsonOutput={passport}
                />
              </div>
            ))}
        </div>
      </div>
      <CardList />
    </>
  );
}
