/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useState, useEffect } from "react";

// --- Types
import { Status, Step } from "../components/Progress";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";

// --Components
import MinimalHeader from "../components/MinimalHeader";
import { PAGE_PADDING } from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import PageRoot from "../components/PageRoot";

// --Chakra UI Elements
import { useDisclosure } from "@chakra-ui/react";

// --- Contexts
import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { useWalletStore } from "../context/walletStore";
import { InitialWelcome } from "../components/InitialWelcome";
import LoadingScreen from "../components/LoadingScreen";

// --- Utils
import { fetchPossibleEVMStamps, ValidatedPlatform } from "../signer/utils";
import BodyWrapper from "../components/BodyWrapper";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useNavigateToPage } from "../hooks/useCustomization";
import { useOneClickVerification } from "../hooks/useOneClickVerification";
import WelcomeFooter from "../components/WelcomeFooter";

const MIN_DELAY = 50;
const MAX_DELAY = 800;
const getStepDelay = () => Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);

export default function Welcome() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { passport, allPlatforms, isLoadingPassport } = useContext(CeramicContext);
  const { dbAccessTokenStatus } = useDatastoreConnectionContext();
  const address = useWalletStore((state) => state.address);
  const { initiateVerification } = useOneClickVerification();

  const navigateToPage = useNavigateToPage();

  // Route user to home page when wallet is disconnected
  useEffect(() => {
    if (!address) {
      navigateToPage("home");
    }
  }, [address]);

  const initialSteps = [
    {
      name: "Scanning",
      status: Status.SUCCESS,
    },
    {
      name: "Double Checking",
      status: Status.NOT_STARTED,
    },
    {
      name: "Validating",
      status: Status.NOT_STARTED,
    },
    {
      name: "Brewing Coffee",
      status: Status.NOT_STARTED,
    },
    {
      name: "Almost there",
      status: Status.NOT_STARTED,
    },
    {
      name: "Ready for review",
      status: Status.NOT_STARTED,
    },
  ];

  return (
    <PageRoot className="text-color-2 flex flex-col min-h-screen">
      <HeaderContentFooterGrid>
        <div className={`${PAGE_PADDING} bg-background`}>
          <MinimalHeader className={`border-b border-foreground-6`} />
        </div>
        <BodyWrapper className="flex justify-center">
          {(isLoadingPassport === IsLoadingPassportState.Idle ||
            isLoadingPassport === IsLoadingPassportState.FailedToConnect) &&
          dbAccessTokenStatus === "connected" ? (
            <InitialWelcome
              onBoardFinished={async () => {
                if (address) {
                  initiateVerification();
                  navigateToPage("dashboard");
                }
              }}
              hasPassports={(passport && passport.stamps.length > 0) || false}
            />
          ) : (
            <LoadingScreen />
          )}
        </BodyWrapper>
        <WelcomeFooter displayPrivacyPolicy={(passport && passport.stamps.length > 0) || true} />
      </HeaderContentFooterGrid>
    </PageRoot>
  );
}
