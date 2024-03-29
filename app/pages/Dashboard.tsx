/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect, useMemo } from "react";
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
import { DoneToastContent } from "../components/DoneToastContent";
import { DashboardScorePanel } from "../components/DashboardScorePanel";
import { DashboardValidStampsPanel } from "../components/DashboardValidStampsPanel";
import { ExpiredStampsPanel } from "../components/ExpiredStampsPanel";

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
import { useWalletStore } from "../context/walletStore";
import { ScorerContext } from "../context/scorerContext";

import { useViewerConnection } from "@self.id/framework";
import { EthereumAuthProvider } from "@self.id/web";
import ProcessingPopup from "../components/ProcessingPopup";
import { getFilterName } from "../config/filters";
import { Button } from "../components/Button";
import { DEFAULT_CUSTOMIZATION_KEY, useCustomization, useNavigateToPage } from "../hooks/useCustomization";
import { DynamicCustomDashboardPanel } from "../components/CustomDashboardPanel";

// --- GTM Module
import TagManager from "react-gtm-module";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";

const success = "../../assets/check-icon2.svg";
const fail = "../assets/verification-failed-bright.svg";

export default function Dashboard() {
  const customization = useCustomization();
  const { useCustomDashboardPanel } = customization;
  const { passport, isLoadingPassport, allPlatforms, verifiedPlatforms } = useContext(CeramicContext);

  useEffect(() => {
    if (customization.key !== DEFAULT_CUSTOMIZATION_KEY) {
      document.title = `Gitcoin Passport | ${
        customization.key.charAt(0).toUpperCase() + customization.key.slice(1)
      } Dashboard`;
      TagManager.dataLayer({
        dataLayer: {
          event: `${customization.key}-dashboard-view`,
        },
      });
    } else {
      document.title = `Gitcoin Passport | Dashboard`;
      TagManager.dataLayer({
        dataLayer: {
          event: "default-dashboard-view",
        },
      });
    }
  }, [customization.key]);

  const address = useWalletStore((state) => state.address);
  const provider = useWalletStore((state) => state.provider);

  const { disconnect, dbAccessTokenStatus, dbAccessToken } = useDatastoreConnectionContext();

  const { refreshScore } = useContext(ScorerContext);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigateToPage = useNavigateToPage();

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
  const { isOpen: retryModalIsOpen, onOpen: onRetryModalOpen, onClose: onRetryModalClose } = useDisclosure();

  // stamp filter
  const router = useRouter();
  const { filter } = router.query;
  const filterName = filter?.length && typeof filter === "string" ? getFilterName(filter) : false;

  const toast = useToast();

  const numPlatforms = useMemo(() => {
    return Object.keys(Object.fromEntries(allPlatforms)).length;
  }, [allPlatforms]);

  const numVerifiedPlatforms = useMemo(() => {
    return Object.keys(verifiedPlatforms).length;
  }, [verifiedPlatforms]);

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (!address) {
      navigateToPage("home");
    }
  }, [address]);

  // Fetch score on page load and when the customization key changes
  useEffect(() => {
    if (address && dbAccessTokenStatus === "connected" && dbAccessToken) {
      refreshScore(address.toLowerCase(), dbAccessToken);
    }
  }, [dbAccessTokenStatus, dbAccessToken, address, customization.key]);

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
            message="Stamps weren't verified. Please try again."
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
    if (isLoadingPassport == IsLoadingPassportState.FailedToConnect && address) {
      // connect to ceramic (deliberately connect with a lowercase DID to match reader)
      onRetryModalClose();
    }
  };

  const closeModalAndDisconnect = () => {
    onRetryModalClose();
    disconnect(address!);
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
            <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-background-2 md:mr-10">
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
      {isLoadingPassport === IsLoadingPassportState.Loading && (
        <ProcessingPopup data-testid="db-stamps-alert">One moment while we load your Stamps...</ProcessingPopup>
      )}

      {isLoadingPassport === IsLoadingPassportState.CreatingPassport && (
        <ProcessingPopup data-testid="initializing-alert">
          <>Initializing your Passport...</>
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
    </>
  );

  const DashboardIllustration = ({ className }: { className: string }) => (
    <div className={className}>
      <img alt="Shield" src="/assets/dashboardIllustration.png" />
    </div>
  );

  const Subheader = ({ className }: { className: string }) => (
    <div className={className}>
      <div className="flex items-center ">
        <span className="mr-20 font-heading text-5xl">My {filterName && `${filterName} `}Stamps</span>
        {passport ? (
          <button
            data-testid="button-passport-json"
            className="h-8 w-8 rounded-md border border-background-2 bg-background-4 text-foreground-3"
            onClick={onOpen}
            title="View Passport JSON"
          >
            {`</>`}
          </button>
        ) : (
          <div
            data-testid="loading-spinner-passport"
            className="flex flex-row items-center rounded-md border-2 border-background-2 bg-background-4 px-[6px] py-1"
          >
            <Spinner className="my-[2px]" thickness="2px" speed="0.65s" emptyColor="darkGray" color="gray" size="sm" />
          </div>
        )}
      </div>
      {filterName && (
        <div>
          <Link href="/#/dashboard">
            <a>
              <span data-testid="select-all" className={`pl-2 text-sm text-color-2`}>
                see all my stamps
              </span>
            </a>
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <PageRoot className="text-color-1">
      {modals}
      <HeaderContentFooterGrid>
        <Header />
        <BodyWrapper className="mt-4 md:mt-6">
          <PageWidthGrid>
            <Subheader className="col-span-full xl:col-span-7 " />
            <DashboardScorePanel
              className={`col-span-full ${useCustomDashboardPanel ? "lg:col-span-4" : "xl:max-h-52"} xl:col-span-7`}
            />
            {useCustomDashboardPanel ? (
              <DynamicCustomDashboardPanel className="col-start-1 col-end-[-1] lg:col-start-5 xl:col-start-8" />
            ) : (
              <DashboardIllustration className="col-start-8 col-end-[-1] row-span-2 hidden xl:block" />
            )}
            <span className="col-start-1 col-end-4 font-heading text-4xl">Add Stamps</span>
            <CardList
              className="col-span-full"
              isLoading={
                isLoadingPassport == IsLoadingPassportState.Loading ||
                isLoadingPassport == IsLoadingPassportState.CreatingPassport ||
                isLoadingPassport == IsLoadingPassportState.FailedToConnect
              }
            />
            <span className="col-start-1 col-end-4 font-heading text-3xl">Add Collected Stamps</span>
            <span className="col-end-[-1] self-center whitespace-nowrap text-right font-alt text-3xl text-foreground-2">
              {numVerifiedPlatforms}/{numPlatforms}
            </span>
            <DashboardValidStampsPanel className="col-span-full" />
            <ExpiredStampsPanel className="col-span-full" />
          </PageWidthGrid>
        </BodyWrapper>
        {/* This footer contains dark colored text and dark images */}
        <Footer lightMode={true} />
      </HeaderContentFooterGrid>
    </PageRoot>
  );
}
