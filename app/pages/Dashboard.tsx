/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect, useRef } from "react";

// --Components
import PageRoot from "../components/PageRoot";
import { CardList } from "../components/CardList";
import WelcomeFooter from "../components/WelcomeFooter";
import Header from "../components/Header";
import BodyWrapper from "../components/BodyWrapper";
import PageWidthGrid from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import { DashboardScorePanel, DashboardScoreExplanationPanel } from "../components/DashboardScorePanel";
import { DashboardValidStampsPanel } from "../components/DashboardValidStampsPanel";
import { ExpiredStampsPanel } from "../components/ExpiredStampsPanel";

// --Chakra UI Elements
import { Modal, ModalBody, ModalContent, ModalFooter, ModalOverlay, useDisclosure } from "@chakra-ui/react";

import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { ScorerContext } from "../context/scorerContext";
import { useOneClickVerification } from "../hooks/useOneClickVerification";

import ProcessingPopup from "../components/ProcessingPopup";
import { Button } from "../components/Button";
import { DEFAULT_CUSTOMIZATION_KEY, useCustomization, useNavigateToPage } from "../hooks/useCustomization";
import { DynamicCustomDashboardPanel } from "../components/CustomDashboardPanel";
import hash from "object-hash";

// --- GTM Module
import TagManager from "react-gtm-module";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import Script from "next/script";
import { Confetti } from "../components/Confetti";
import { PassportDetailsButton } from "../components/PassportDetailsButton";
import { useMessage } from "../hooks/useMessage";
import { Customization } from "../utils/customizationUtils";
import { useAccount } from "wagmi";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const DashboardCTAs = ({ customization }: { customization: Customization }) => {
  const { useCustomDashboardPanel } = customization;
  const explanationPanel = customization.key !== "none" ? customization?.showExplanationPanel : true;
  return (
    <div className="col-span-full mt-2 flex flex-col xl:flex-row gap-8">
      <div className="col-span-full order-2 flex flex-col grow lg:flex-row gap-8 mt-0.5">
        <DashboardScorePanel className={`w-full ${useCustomDashboardPanel || "xl:w-1/2"}`} />
        {explanationPanel && <DashboardScoreExplanationPanel />}
      </div>
      {useCustomDashboardPanel && (
        <DynamicCustomDashboardPanel
          className={`order-1 lg:order-2 max-w-full ${explanationPanel ? "xl:max-w-md" : "xl:w-2/3"}`}
        />
      )}
    </div>
  );
};

export default function Dashboard() {
  const customization = useCustomization();
  const { isLoadingPassport, allPlatforms, databaseReady } = useContext(CeramicContext);
  const { disconnect, dbAccessTokenStatus, dbAccessToken, did } = useDatastoreConnectionContext();
  const { address } = useAccount();
  const { initiateVerification } = useOneClickVerification();
  const { success, failure } = useMessage();

  // This shouldn't be necessary, but using this to prevent unnecessary re-initialization
  // until ceramicContext is refactored and memoized
  const verifiedParamsHash = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (did && address && databaseReady) {
      const paramsHash = hash.sha1({
        did,
        address,
        allPlatforms,
        databaseReady,
      });
      if (paramsHash !== verifiedParamsHash.current) {
        initiateVerification(did, address);
        verifiedParamsHash.current = paramsHash;
      }
    }
  }, [allPlatforms, did, address, databaseReady]);

  useEffect(() => {
    if (customization.key !== DEFAULT_CUSTOMIZATION_KEY) {
      document.title = `Passport XYZ | ${
        customization.key.charAt(0).toUpperCase() + customization.key.slice(1)
      } Dashboard`;
      TagManager.dataLayer({
        dataLayer: {
          event: `${customization.key}-dashboard-view`,
        },
      });
    } else {
      document.title = `Passport XYZ | Dashboard`;
      TagManager.dataLayer({
        dataLayer: {
          event: "default-dashboard-view",
        },
      });
    }
  }, [customization.key]);

  const { refreshScore } = useContext(ScorerContext);

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

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (!address || dbAccessTokenStatus !== "connected") {
      navigateToPage("home");
    }
  }, [address, dbAccessTokenStatus]);

  // Fetch score on page load and when the customization key changes
  useEffect(() => {
    if (address && dbAccessTokenStatus === "connected" && dbAccessToken) {
      const forceRescore = customization.key !== DEFAULT_CUSTOMIZATION_KEY;
      refreshScore(address.toLowerCase(), dbAccessToken, forceRescore);
    }
  }, [dbAccessTokenStatus, dbAccessToken, address, customization.key]);

  //show toasts from 1click flow
  useEffect(() => {
    const oneClickRefresh = localStorage.getItem("successfulRefresh");
    if (oneClickRefresh && oneClickRefresh === "true") {
      success({
        title: "Success",
        message: "Your stamps are verified!",
      });
    } else if (oneClickRefresh && oneClickRefresh === "false") {
      failure({
        title: "Failure",
        message: "Stamps weren't verified. Please try again.",
      });
    }
    localStorage.removeItem("successfulRefresh");
  }, [success, failure]);

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

      {isLoadingPassport == IsLoadingPassportState.FailedToConnect && retryModal}
    </>
  );

  return (
    <PageRoot className="text-color-1">
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
      {modals}
      <HeaderContentFooterGrid>
        <Confetti />
        <Header />
        <BodyWrapper className="mt-4 md:mt-6">
          <PageWidthGrid>
            <DashboardCTAs customization={customization} />

            <span id="add-stamps" className="col-span-full font-heading text-4xl">
              Add Stamps
            </span>
            <CardList
              className="col-span-full"
              isLoading={
                isLoadingPassport == IsLoadingPassportState.Loading ||
                isLoadingPassport == IsLoadingPassportState.CreatingPassport ||
                isLoadingPassport == IsLoadingPassportState.FailedToConnect
              }
            />
            <span className="col-start-1 col-end-5 font-heading text-3xl">Collected Stamps</span>
            <PassportDetailsButton className="col-end-[-1] col-start-1 md:col-start-[-3] justify-self-end self-center" />
            <DashboardValidStampsPanel className="col-span-full" />
            <ExpiredStampsPanel className="col-span-full" />
          </PageWidthGrid>
        </BodyWrapper>
        {/* This footer contains dark colored text and dark images */}
        <WelcomeFooter displayPrivacyPolicy={false} />
      </HeaderContentFooterGrid>
    </PageRoot>
  );
}
