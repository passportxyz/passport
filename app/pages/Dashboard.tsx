/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect, useRef } from "react";

// --Components
import PageRoot from "../components/PageRoot";
import { CardList } from "../components/CardList";
import { PartnersSection } from "../components/PartnersSection";
import WelcomeFooter from "../components/WelcomeFooter";
import Header from "../components/Header";
import BodyWrapper from "../components/BodyWrapper";
import PageWidthGrid from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import { DashboardScorePanel, DashboardScoreExplanationPanel } from "../components/DashboardScorePanel";
import { useSupportBanners } from "../hooks/useSupportBanners";

// --Chakra UI Elements
import { Modal, ModalBody, ModalContent, ModalFooter, ModalOverlay, useDisclosure } from "@chakra-ui/react";

import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { ScorerContext } from "../context/scorerContext";

import ProcessingPopup from "../components/ProcessingPopup";
import { Button } from "../components/Button";
import { DEFAULT_CUSTOMIZATION_KEY, useCustomization, useNavigateToPage } from "../hooks/useCustomization";
import { DynamicCustomDashboardPanel } from "../components/CustomDashboardPanel";

// --- GTM Module
import TagManager from "react-gtm-module";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import Script from "next/script";
import { Confetti } from "../components/Confetti";
import { useMessage } from "../hooks/useMessage";
import { Customization } from "../utils/customizationUtils";
import { useAccount } from "wagmi";
import { useRadialBackgroundColorForHeader } from "../components/Header";
import { HumnSeasonPanel } from "../components/humanPoints";
import { SectionTabs } from "../components/SectionTabs";
import { SectionRefsProvider, useSectionRefs } from "../context/SectionRefsContext";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const StampsHeader: React.FC = () => {
  const { stampsRef } = useSectionRefs();
  return (
    <span ref={stampsRef} className="px-4 md:px-0 col-span-full font-heading text-4xl text-gray-800 mt-12">
      Add Stamps
    </span>
  );
};

export const DashboardCTAs = ({ customization }: { customization: Customization }) => {
  const { useCustomDashboardPanel, hideHumnBranding } = customization;
  const explanationPanel = customization.key !== "none" ? customization?.showExplanationPanel : true;

  const backgroundColor = useRadialBackgroundColorForHeader();

  return (
    <div className="relative col-span-full">
      <div className="col-span-full mt-2 flex flex-col xl:flex-row gap-8 relative left-0 top-0 z-10">
        <div className="col-span-full flex flex-col grow lg:flex-row gap-8 mt-0.5">
          <DashboardScorePanel className={`w-full ${useCustomDashboardPanel || "xl:w-1/2"}`} />
          {!hideHumnBranding && <HumnSeasonPanel className="w-full xl:w-1/2" />}
          {explanationPanel && <DashboardScoreExplanationPanel />}
        </div>
        {useCustomDashboardPanel && <DynamicCustomDashboardPanel className="max-w-full xl:w-2/3" />}
      </div>
      <div
        style={{ background: `radial-gradient(ellipse 100vw 200px at 50% -32px, white, ${backgroundColor})` }}
        className="w-[calc(100%+100px)] h-[calc(100%+30px)] rounded-b-[40px] relative left-[-50px] top-[calc(-100%)] shadow-2xl"
      ></div>
    </div>
  );
};

export default function Dashboard() {
  const customization = useCustomization();
  const { isLoadingPassport } = useContext(CeramicContext);
  const { disconnect, dbAccessTokenStatus, dbAccessToken } = useDatastoreConnectionContext();
  const { address } = useAccount();

  const { success, failure } = useMessage();
  const { banners } = useSupportBanners();

  useEffect(() => {
    if (customization.key !== DEFAULT_CUSTOMIZATION_KEY) {
      document.title = `Human Passport | ${
        customization.key.charAt(0).toUpperCase() + customization.key.slice(1)
      } Dashboard`;
      TagManager.dataLayer({
        dataLayer: {
          event: `${customization.key}-dashboard-view`,
        },
      });
    } else {
      document.title = `Human Passport | Dashboard`;
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
      // Preserve query params for after login (hash routing puts params in the hash)
      const hashParts = window.location.hash.split("?");
      if (hashParts[1]) {
        sessionStorage.setItem("returnSearch", "?" + hashParts[1]);
      }
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

  // show toasts from 1click flow
  useEffect(() => {
    const oneClickRefresh = localStorage.getItem("successfulRefresh");
    if (oneClickRefresh && oneClickRefresh === "true") {
      success({
        title: "Success",
        message: "Your Stamps are verified!",
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
          <div className="flex flex-row text-color-4">
            <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-color- md:mr-4">
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
      <SectionRefsProvider>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
        </Script>
        <HeaderContentFooterGrid>
          <Confetti />
          <Header showTopNav={true} />
          <BodyWrapper className="mt-4 md:mt-0 pt-12 md:pt-16">
            {
              // This is just offsetting the dashboard, such that it is shown below the banners
              banners.map((_v, idx) => (
                <div className="col-span-full h-8" key={idx}></div>
              ))
            }
            <PageWidthGrid>
              <DashboardCTAs customization={customization} />
              <StampsHeader />
              <CardList
                className="col-span-full"
                isLoading={
                  isLoadingPassport == IsLoadingPassportState.Loading ||
                  isLoadingPassport == IsLoadingPassportState.CreatingPassport ||
                  isLoadingPassport == IsLoadingPassportState.FailedToConnect
                }
              />
              <PartnersSection />
            </PageWidthGrid>
          </BodyWrapper>
          {/* This footer contains dark colored text and dark images */}
          <WelcomeFooter displayPrivacyPolicy={false} />
        </HeaderContentFooterGrid>
        <SectionTabs />
        {modals}
      </SectionRefsProvider>
    </PageRoot>
  );
}
