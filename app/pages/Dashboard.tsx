/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRouter } from "next/router";
import Link from "next/link";

// --Components
import PageRoot from "../components/PageRoot";
import { CardList } from "../components/CardList";
import { JsonOutputModal } from "../components/JsonOutputModal";
import { Footer } from "../components/Footer";
import Header from "../components/Header";
import BodyWrapper from "../components/BodyWrapper";
import PageWidthGrid from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import Tooltip from "../components/Tooltip";
import { DoneToastContent } from "../components/DoneToastContent";

// --Chakra UI Elements
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";
import { ScorerContext } from "../context/scorerContext";

import { useViewerConnection } from "@self.id/framework";
import { EthereumAuthProvider } from "@self.id/web";
import { RefreshStampModal } from "../components/RefreshStampModal";
import { ExpiredStampModal } from "../components/ExpiredStampModal";
import ProcessingPopup from "../components/ProcessingPopup";
import SyncToChainButton from "../components/SyncToChainButton";
import { getFilterName } from "../config/filters";
import { baseGoerliChainId, hardhatChainId, sepoliaChainId } from "../utils/onboard";
import { Button } from "../components/Button";

// --- GTM Module
import TagManager from "react-gtm-module";

const isLiveAlloScoreEnabled = process.env.NEXT_PUBLIC_FF_LIVE_ALLO_SCORE === "on";
const isOnChainSyncEnabled = process.env.NEXT_PUBLIC_FF_CHAIN_SYNC === "on";

const success = "../../assets/check-icon2.svg";
const fail = "../assets/verification-failed-bright.svg";

export default function Dashboard() {
  const { passport, isLoadingPassport, passportHasCacaoError, cancelCeramicConnection, expiredProviders } =
    useContext(CeramicContext);
  const { wallet, toggleConnection, userWarning, setUserWarning } = useContext(UserContext);
  const { score, rawScore, refreshScore, scoreDescription, passportSubmissionState } = useContext(ScorerContext);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();

  // ------------------- BEGIN Data items for Google Tag Manager -------------------
  const startTime = Date.now();

  useEffect(() => {
    const handleBeforeUnload = () => {
      const endTime = Date.now();
      const durationInSeconds = (endTime - startTime) / 1000;

      // Track the timing event
      TagManager.dataLayer({
        dataLayer: {
          page: "/dashboard",
          event: "passport_interaction_duration",
          passportInteractionDurationCategory: "Passport Interaction",
          passportInteractionDurationVar: "Passport Interaction",
          passportInteractionDurationValue: durationInSeconds,
        },
        dataLayerName: "PageDataLayer",
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
  // ------------------- END Data items for Google Tag Manager -------------------

  const [viewerConnection, ceramicConnect] = useViewerConnection();
  const { isOpen: retryModalIsOpen, onOpen: onRetryModalOpen, onClose: onRetryModalClose } = useDisclosure();

  const [refreshModal, setRefreshModal] = useState(false);
  const [expiredStampModal, setExpiredStampModal] = useState(false);
  const { dbAccessToken, dbAccessTokenStatus } = useContext(UserContext);

  // stamp filter
  const router = useRouter();
  const { filter } = router.query;
  const filterName = filter?.length && typeof filter === "string" ? getFilterName(filter) : false;

  const toast = useToast();

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (!wallet) {
      navigate("/");
    } else {
      if (dbAccessTokenStatus === "connected" && dbAccessToken) {
        refreshScore(wallet.accounts[0].address.toLowerCase(), dbAccessToken);
      }
    }
  }, [wallet, dbAccessToken, dbAccessTokenStatus]);

  //show toasts from 1click flow
  useEffect(() => {
    const oneClickRefresh = localStorage.getItem("successfulRefresh");
    if (oneClickRefresh && oneClickRefresh === "true") {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent title="Success" message="Your stamps are verified!" icon={success} result={result} />
        ),
      });
    } else if (oneClickRefresh && oneClickRefresh === "false") {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title="Failure"
            message="Stamps weren't verifed. Please try again."
            icon={fail}
            result={result}
          />
        ),
      });
    }
    localStorage.removeItem("successfulRefresh");
  }, []);

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
    if (passportHasCacaoError) {
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
  }, [passportHasCacaoError]);

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
  }, [expiredProviders]);

  const retryModal = (
    <Modal isOpen={retryModalIsOpen} onClose={onRetryModalClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalBody mt={4}>
          <div className="flex flex-row">
            <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 md:mr-10">
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
            <Button data-testid="retry-modal-try-again" variant="secondary" className="mr-2" onClick={retryConnection}>
              Try Again
            </Button>
            <Button data-testid="retry-modal-close" onClick={closeModalAndDisconnect}>
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
        <ProcessingPopup data-testid="selfId-connection-alert">
          Please user your wallet to sign the message prompt and complete the sign-in process.
        </ProcessingPopup>
      )}

      {isLoadingPassport === IsLoadingPassportState.Loading && (
        <ProcessingPopup data-testid="db-stamps-alert">One moment while we load your Stamps...</ProcessingPopup>
      )}

      {isLoadingPassport === IsLoadingPassportState.LoadingFromCeramic && (
        <ProcessingPopup data-testid="ceramic-stamps-alert">
          <>
            Connecting to Ceramic...
            <span
              className="pl-4 text-white no-underline hover:cursor-pointer hover:underline md:pl-12"
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
      <PageWidthGrid className="my-4 min-h-[64px]">
        <div className="col-span-3 flex items-center justify-items-center self-center lg:col-span-4">
          <div className="flex text-2xl">
            <span className="font-heading">My {filterName && `${filterName} `}Stamps</span>
            {filterName && (
              <Link href="/dashboard">
                <a>
                  <span data-testid="select-all" className={`pl-2 text-sm text-purple-connectPurple`}>
                    see all my stamps
                  </span>
                </a>
              </Link>
            )}
            <Tooltip>
              Gitcoin Passport is an identity aggregator that helps you build a digital identifier showcasing your
              unique humanity. Select the verification stamps you&apos;d like to connect to start building your
              passport. The more verifications you have&#44; the stronger your passport will be.
            </Tooltip>
          </div>
        </div>
        <div className={`col-span-1 col-end-[-1] flex justify-self-end`}>
          {isLiveAlloScoreEnabled && (
            <div className={"flex min-w-fit items-center"}>
              <div className={`pr-2 ${passportSubmissionState === "APP_REQUEST_PENDING" ? "visible" : "invisible"}`}>
                <Spinner
                  className="my-[2px]"
                  thickness="2px"
                  speed="0.65s"
                  emptyColor="darkGray"
                  color="gray"
                  size="md"
                />
              </div>
              <div className="flex flex-col items-center">
                <div className="flex text-2xl">
                  {/* TODO add color to theme */}
                  <span className={`${score == 1 ? "text-accent-3" : "text-[#FFE28A]"}`}>{rawScore.toFixed(2)}</span>
                  <Tooltip>
                    Your Unique Humanity Score is based out of 100 and measures how unique you are. The current passing
                    score threshold is 15.
                  </Tooltip>
                </div>
                <div className="flex whitespace-nowrap text-sm">{scoreDescription}</div>
              </div>
            </div>
          )}

          <div className="ml-4 flex flex-col place-items-center gap-4 self-center md:flex-row">
            <SyncToChainButton />
            {passport ? (
              <button
                data-testid="button-passport-json-mobile"
                className="h-10 w-10 rounded-md border border-muted"
                onClick={onOpen}
              >
                {`</>`}
              </button>
            ) : (
              <div
                data-testid="loading-spinner-passport"
                className="flex flex-row items-center rounded-md border-2 border-muted py-2 px-4"
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
        </div>
      </PageWidthGrid>
    ),
    [filterName, onOpen, passport, score, rawScore, scoreDescription, passportSubmissionState]
  );

  return (
    <PageRoot className="text-color-1">
      {modals}
      <HeaderContentFooterGrid>
        <Header subheader={subheader} />
        <BodyWrapper className="mt-4 md:mt-6">
          <CardList
            isLoading={
              isLoadingPassport == IsLoadingPassportState.Loading ||
              isLoadingPassport == IsLoadingPassportState.LoadingFromCeramic ||
              isLoadingPassport == IsLoadingPassportState.FailedToConnect
            }
          />
        </BodyWrapper>
        {/* This footer contains dark colored text and dark images */}
        <Footer lightMode={true} />
      </HeaderContentFooterGrid>
    </PageRoot>
  );
}
