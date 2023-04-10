/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRouter } from "next/router";

// --Components
import PageRoot from "../components/PageRoot";
import { CardList } from "../components/CardList";
import { JsonOutputModal } from "../components/JsonOutputModal";
import { Footer } from "../components/Footer";
import Header from "../components/Header";
import PageWidthGrid from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import TooltipPopover from "../components/TooltipPopover";

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
import { RefreshStampModal } from "../components/RefreshStampModal";
import { ExpiredStampModal } from "../components/ExpiredStampModal";
import ProcessingPopup from "../components/ProcessingPopup";
import { getFilterName } from "../config/filters";

export default function Dashboard() {
  const { passport, isLoadingPassport, passportHasCacaoError, cancelCeramicConnection, expiredProviders } =
    useContext(CeramicContext);
  const { wallet, toggleConnection, userWarning, setUserWarning } = useContext(UserContext);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();

  const [viewerConnection, ceramicConnect] = useViewerConnection();
  const { isOpen: retryModalIsOpen, onOpen: onRetryModalOpen, onClose: onRetryModalClose } = useDisclosure();

  const [refreshModal, setRefreshModal] = useState(false);
  const [expiredStampModal, setExpiredStampModal] = useState(false);

  // stamp filter
  const router = useRouter();
  const { filter } = router.query;
  const filterName = filter?.length && typeof filter === "string" ? getFilterName(filter) : false;

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (!wallet) {
      navigate("/");
    }
  }, [wallet]);

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
    toggleConnection();
  };

  useEffect(() => {
    if (isLoadingPassport == IsLoadingPassportState.FailedToConnect) {
      onRetryModalOpen();
    }
  }, [isLoadingPassport]);

  useEffect(() => {
    if (passportHasCacaoError()) {
      setUserWarning({
        name: "cacaoError",
        content: (
          <div className="flex max-w-screen-lg flex-col items-center text-center">
            We have detected some broken stamps in your passport. Your passport is currently locked because of this. We
            need to fix these errors before you continue using Passport. This might take up to 5 minutes.
            <button className="ml-2 flex underline" onClick={() => setRefreshModal(true)}>
              Reset Passport <img className="ml-1 w-6" src="./assets/arrow-right-icon.svg" alt="arrow-right"></img>
            </button>
          </div>
        ),
        dismissible: false,
      });
    } else if (userWarning?.name === "cacaoError") {
      setUserWarning();
    }
  });

  useEffect(() => {
    if (expiredProviders.length > 0) {
      setUserWarning({
        name: "expiredStamp",
        icon: <img className="mr-2 h-6" alt="Clock Icon" src="./assets/clock-icon.svg" />,
        content: (
          <div className="flex justify-center">
            Some of your stamps have expired. You can remove them from your Passport.
            <button className="ml-2 flex underline" onClick={() => setExpiredStampModal(true)}>
              Remove Expired Stamps{" "}
              <img className="ml-1 w-6" src="./assets/arrow-right-icon.svg" alt="arrow-right"></img>
            </button>
          </div>
        ),
        dismissible: false,
      });
    } else if (userWarning?.name === "expiredStamp") {
      setUserWarning();
    }
  });

  const retryModal = (
    <Modal isOpen={retryModalIsOpen} onClose={onRetryModalClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody mt={4}>
          <div className="flex flex-row">
            <div className="sm:mr-10 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
              <img alt="shield-exclamation-icon" src="./assets/shield-exclamation-icon.svg" />
            </div>
            <div className="flex flex-col" data-testid="retry-modal-content">
              <p className="text-lg font-bold">Datasource Connection Error</p>
              <p>
                We cannot connect to the datastore where your Stamp data is stored. Please try again in a few minutes.
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

  const modals = (
    <>
      {viewerConnection.status === "connecting" && (
        <ProcessingPopup data-testid="selfId-connection-alert">Waiting for wallet signature...</ProcessingPopup>
      )}

      {isLoadingPassport === IsLoadingPassportState.Loading && (
        <ProcessingPopup data-testid="db-stamps-alert">One moment while we load your Stamps...</ProcessingPopup>
      )}

      {isLoadingPassport === IsLoadingPassportState.LoadingFromCeramic && (
        <ProcessingPopup data-testid="ceramic-stamps-alert">
          <>
            Connecting to Ceramic...
            <span
              className="sm:pl-8 pl-4 text-white no-underline hover:cursor-pointer hover:underline md:pl-12"
              onClick={cancelCeramicConnection}
            >
              Cancel
            </span>
          </>
        </ProcessingPopup>
      )}

      <JsonOutputModal
        isOpen={isOpen}
        onClose={onClose}
        title={"Passport JSON"}
        subheading={"You can find the Passport JSON data below"}
        jsonOutput={passport}
      />

      {isLoadingPassport == IsLoadingPassportState.FailedToConnect && retryModal}

      {refreshModal && <RefreshStampModal isOpen={refreshModal} onClose={() => setRefreshModal(false)} />}
      {expiredStampModal && (
        <ExpiredStampModal isOpen={expiredStampModal} onClose={() => setExpiredStampModal(false)} />
      )}
    </>
  );

  const subheader = useMemo(
    () => (
      <PageWidthGrid nested={true} className="my-4">
        <div className="col-span-3 flex items-center justify-items-center self-center lg:col-span-4">
          <p className="text-2xl">
            My {filterName && `${filterName} `}Stamps
            {filterName && (
              <a href="/#/dashboard">
                <span data-testid="select-all" className={`pl-2 text-sm text-purple-connectPurple`}>
                  see all my stamps
                </span>
              </a>
            )}
          </p>
          <TooltipPopover>
            Gitcoin Passport is an identity aggregator that helps you build a digital identifier showcasing your unique
            humanity. Select the verification stamps you&apos;d like to connect to start building your passport. The
            more verifications you have&#44; the stronger your passport will be.
          </TooltipPopover>
        </div>

        <div className="col-span-1 col-end-[-1] justify-self-end">
          {passport ? (
            <button
              data-testid="button-passport-json-mobile"
              className="rounded-md border-2 border-gray-300 py-2 px-4"
              onClick={onOpen}
            >
              {`</>`}
            </button>
          ) : (
            <div
              data-testid="loading-spinner-passport"
              className="flex flex-row items-center rounded-md border-2 border-gray-300 py-2 px-4"
            >
              <Spinner
                className="my-[2px]"
                thickness="2px"
                speed="0.65s"
                emptyColor="darkGray"
                color="gray"
                size="md"
              />
            </div>
          )}
        </div>
      </PageWidthGrid>
    ),
    [filterName, onOpen, passport]
  );

  return (
    <PageRoot className="text-color-1">
      {modals}
      <HeaderContentFooterGrid>
        <Header subheader={subheader} />
        <PageWidthGrid className="mt-8">
          <CardList
            cardClassName="col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-3"
            isLoading={
              isLoadingPassport == IsLoadingPassportState.Loading ||
              isLoadingPassport == IsLoadingPassportState.LoadingFromCeramic ||
              isLoadingPassport == IsLoadingPassportState.FailedToConnect
            }
          />
        </PageWidthGrid>
        {/* This footer contains dark colored text and dark images */}
        <Footer lightMode={false} />
      </HeaderContentFooterGrid>
    </PageRoot>
  );
}
