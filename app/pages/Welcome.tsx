/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect } from "react";

// --Components
import MinimalHeader from "../components/MinimalHeader";
import { PAGE_PADDING } from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import PageRoot from "../components/PageRoot";

// --- Contexts
import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { InitialWelcome } from "../components/InitialWelcome";
import LoadingScreen from "../components/LoadingScreen";

// --- Utils
import BodyWrapper from "../components/BodyWrapper";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useNavigateToPage } from "../hooks/useCustomization";
import WelcomeFooter from "../components/WelcomeFooter";
import { useAccount } from "wagmi";

export default function Welcome() {
  const { passport, isLoadingPassport } = useContext(CeramicContext);
  const { dbAccessTokenStatus } = useDatastoreConnectionContext();
  const { address } = useAccount();

  const navigateToPage = useNavigateToPage();

  // Route user to home page when wallet is disconnected
  useEffect(() => {
    if (!address || dbAccessTokenStatus !== "connected") {
      navigateToPage("home");
    }
  }, [address]);

  return (
    <PageRoot className="text-color-2 flex flex-col min-h-screen">
      <HeaderContentFooterGrid>
        <div className={`${PAGE_PADDING} bg-background`}>
          <MinimalHeader className={`border-b border-foreground-6`} />
        </div>
        <BodyWrapper className="flex justify-center">
          {isLoadingPassport === IsLoadingPassportState.Idle ||
          isLoadingPassport === IsLoadingPassportState.FailedToConnect ? (
            <InitialWelcome
              onBoardFinished={async () => {
                if (address) {
                  navigateToPage("dashboard");
                }
              }}
              hasPassports={(passport && passport.stamps.length > 0) || false}
            />
          ) : (
            <LoadingScreen className="mb-20" />
          )}
        </BodyWrapper>
        <WelcomeFooter displayPrivacyPolicy={true} />
        <div className="pb-28 md:pb-0">
          {/* Just adding some spacing to make the footer visible above the fixed button area */}
        </div>
      </HeaderContentFooterGrid>
    </PageRoot>
  );
}
