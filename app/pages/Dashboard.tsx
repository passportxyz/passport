/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// --Components
import { CardList } from "../components/CardList";
import { JsonOutputModal } from "../components/JsonOutputModal";
import { Footer } from "../components/Footer";
// --- GoodDollar
// import { Web3Provider as GoodDollarWeb3Provider } from "@gooddollar/web3sdk-v2";
// import { JsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";

// --Chakra UI Elements
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";

import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

import { useViewerConnection } from "@self.id/framework";
import { EthereumAuthProvider } from "@self.id/web";
import { useRouter } from "next/router";

export default function Dashboard() {
  const { wallet, handleConnection } = useContext(UserContext);
  const { passport, isLoadingPassport } = useContext(CeramicContext);
  // const { passport, wallet, isLoadingPassport, handleConnection, signer } = useContext(UserContext);
  const router = useRouter();
  const [searchParams] = useSearchParams();
  // const provider = useMemo(() => {
  //   if (signer) {
  //     const provider = signer && new JsonRpcProvider("https://rpc.fuse.io");
  //     provider.getSigner = () => signer as JsonRpcSigner;
  //     return provider;
  //   }
  // }, [signer]);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();

  const [viewerConnection, ceramicConnect] = useViewerConnection();

  const { isOpen: retryModalIsOpen, onOpen: onRetryModalOpen, onClose: onRetryModalClose } = useDisclosure();

  // Route user to home when wallet is disconnected
  useEffect(() => {
    //this is a fix for nextjs SSR on gooddollar back redirect not to redirect to home, but stay on dashboard
    if (router?.isReady === false) return;
    const gooddollarLogin = searchParams.get("login") || searchParams.get("verified");
    // Gooddollar verified login is added to the path, so stay here we
    if (gooddollarLogin) return;
    else if (!wallet) {
      navigate("/");
    }
  }, [wallet, router]);

  // Allow user to retry Ceramic connection if failed
  const retryConnection = () => {
    if (isLoadingPassport == IsLoadingPassportState.FailedToConnect && wallet) {
      // connect to ceramic (deliberately connect with a lowercase DID to match reader)
      ceramicConnect(new EthereumAuthProvider(wallet.provider, wallet.accounts[0].address.toLowerCase()));
      onRetryModalClose();
    }
  };

  const closeModalAndDisconnect = () => {
    onRetryModalClose();
    // toggle wallet connect/disconnect
    handleConnection();
  };

  useEffect(() => {
    if (isLoadingPassport == IsLoadingPassportState.FailedToConnect) {
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
              <p className="text-lg font-bold">Ceramic Network Error</p>
              <p>
                The Gitcoin Passport relies on the Ceramic Network which currently is having network issues. Please try
                again later.
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
      <div className="invisible flex w-full flex-col flex-wrap border-b-2 p-5 md:visible md:flex-row">
        <div className="float-right mb-4 flex flex-row items-center font-medium text-gray-900 md:mb-0">
          <img src="/assets/gitcoinLogoDark.svg" alt="Gitcoin Logo" />
          <img className="ml-6 mr-6" src="/assets/logoLine.svg" alt="Logo Line" />
          <img src="/assets/passportLogoBlack.svg" alt="pPassport Logo" />
          {/* <GoodDollarWeb3Provider
        config={{}}
        web3Provider={provider}
        env={process.env.NEXT_PUBLIC_GOODDOLLAR_ENV || "fuse"}
      >
        <div className="flex w-full flex-col flex-wrap border-b-2 p-5 md:flex-row">
          <div className="float-right mb-4 flex flex-row items-center font-medium text-gray-900 md:mb-0">
            <img src="/assets/gitcoinLogoDark.svg" alt="Gitcoin Logo" />
            <img className="ml-6 mr-6" src="/assets/logoLine.svg" alt="Logo Line" />
            <img src="/assets/passportLogoBlack.svg" alt="pPassport Logo" />*/}
        </div>
      </div>

      {viewerConnection.status === "connecting" && (
        <div className="my-2 h-10">
          <div
            className="absolute left-2 right-2 w-full rounded bg-blue-darkblue py-3 px-8 md:right-1/2 md:left-1/3 md:w-5/12 md:py-4 xl:w-1/4"
            data-testid="selfId-connection-alert"
          >
            <span className="absolute top-0 right-0 flex h-3 w-3 translate-x-1/2 -translate-y-1/2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-jade opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-jade"></span>
            </span>
            <span className="font-bold text-green-jade"> Waiting for wallet signature...</span>
          </div>
        </div>
      )}

      <div className="flex w-full flex-wrap-reverse px-2 md:mt-4 md:flex-wrap md:px-10">
        <div className="md:w-3/4">
          <p className="mb-4 text-2xl text-black">My Stamps</p>
          <p className="text-xl text-black">
            Select the decentralized identity verification stamps you&apos;d like to connect to.
          </p>
        </div>

        {viewerConnection.status !== "connecting" && (
          <div className="my-2 flex grow flex-row justify-between md:hidden">
            <div className="float-right mb-4 flex flex-row items-center font-medium text-gray-900 md:mb-0">
              <img src="/assets/gitcoinLogoDark.svg" alt="Gitcoin Logo" />
              <img className="ml-6 mr-6" src="/assets/logoLine.svg" alt="Logo Line" />
              <img src="/assets/passportLogoBlack.svg" alt="pPassport Logo" />
            </div>
            {passport && (
              <button
                data-testid="button-passport-json-mobile"
                className="float-right ml-auto rounded-md border-2 border-gray-300 py-2 px-4 text-black"
                onClick={onOpen}
              >
                {`</>`}
              </button>
            )}
          </div>
        )}
        <div className="w-full md:w-1/4">
          {isLoadingPassport == IsLoadingPassportState.FailedToConnect && retryModal}
          {viewerConnection.status !== "connecting" &&
            (passport ? (
              <div>
                <button
                  data-testid="button-passport-json"
                  className="float-right hidden rounded-md border-2 border-gray-300 py-2 px-6 text-black md:inline-block"
                  onClick={onOpen}
                >
                  {`</>`} Passport JSON
                </button>

                <JsonOutputModal
                  isOpen={isOpen}
                  onClose={onClose}
                  title={"Passport JSON"}
                  subheading={"You can find the Passport JSON data below"}
                  jsonOutput={passport}
                />
              </div>
            ) : (
              <div>
                <div
                  className="float-right flex flex-row items-center rounded-md border-2 border-gray-300 py-2 px-6 text-black"
                  data-testid="loading-spinner-passport"
                >
                  <Spinner thickness="4px" speed="0.65s" emptyColor="lightGray" color="gray" size="md" />
                  <h1 className="m-4">Connecting</h1>
                </div>
              </div>
            ))}
        </div>
      </div>
      <CardList
        isLoading={
          isLoadingPassport == IsLoadingPassportState.Loading ||
          isLoadingPassport == IsLoadingPassportState.FailedToConnect
        }
      />
      {/* This footer contains dark colored text and dark images */}
      <Footer lightMode={false} />
      {/* <div className="mt-6 flex w-full flex-wrap px-10">
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
                    className="float-right rounded-md border-2 border-gray-300 px-6 py-2 text-black"
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
      </GoodDollarWeb3Provider> */}
    </>
  );
}
