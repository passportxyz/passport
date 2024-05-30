/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- React Methods
import React, { useEffect, useState } from "react";

// --- Shared data context
import { useWalletStore } from "../context/walletStore";

// --- Components
import PageRoot from "../components/PageRoot";
import SIWEButton from "../components/SIWEButton";
import { checkShowOnboard } from "../utils/helpers";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../components/DoneToastContent";
import { WebmVideo } from "../components/WebmVideo";
import { DEFAULT_CUSTOMIZATION_KEY, useCustomization, useNavigateToPage } from "../hooks/useCustomization";
import WelcomeFooter from "../components/WelcomeFooter";

export default function Home() {
  const address = useWalletStore((state) => state.address);
  const connectWallet = useWalletStore((state) => state.connect);
  const connectError = useWalletStore((state) => state.error);
  const { connect: connectDatastore } = useDatastoreConnectionContext();
  const toast = useToast();
  const [enableEthBranding, setEnableEthBranding] = useState(false);
  const customization = useCustomization();

  const navigateToPage = useNavigateToPage();

  // Route user to dashboard when wallet is connected
  useEffect(() => {
    if (address) {
      if (checkShowOnboard()) {
        navigateToPage("welcome");
      } else {
        navigateToPage("dashboard");
      }
    }
  }, [address]);

  useEffect(() => {
    const usingCustomization = customization.key !== DEFAULT_CUSTOMIZATION_KEY;
    setEnableEthBranding(!usingCustomization);
  }, [customization.key]);

  useEffect(() => {
    if (connectError) {
      console.log("displaying Connection Error", connectError);
      console.log("displaying Connection Error", (connectError as Error).message);
      toast({
        duration: 6000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title={"Connection Error"}
            body={(connectError as Error).message}
            icon="../assets/verification-failed-bright.svg"
            result={result}
          />
        ),
      });
    }
  }, [connectError]);

  return (
    <PageRoot className="text-color-1 flex flex-col min-h-screen">
      <div className="flex-grow items-center justify-center self-center p-8">
        <div className="z-10 grid grid-flow-row grid-cols-2 gap-4 lg:grid-flow-col p-2">
          <div className="col-span-2 text-6xl md:text-7xl lg:row-start-2">
            <div className="grid grid-flow-col justify-start">
              <img src="./assets/passportLogoWhite.svg" alt="Icon" className="h-20 self-center" />
              <p className="p-2">Passport</p>
            </div>
          </div>
          <div className="col-span-2 mb-4 text-2xl leading-none text-foreground-2 md:text-5xl">
            Unlock the best of web3
          </div>
          <WebmVideo
            src="/assets/splashPageLogo.webm"
            fallbackSrc="/assets/splashPageLogoFallback.svg"
            alt="Passport Logo"
            className="col-span-2 w-full max-w-md lg:col-start-3 lg:row-span-6 lg:mr-8 lg:max-w-2xl"
          />
          <div className="col-span-2 max-w-md text-lg lg:max-w-sm">
            Access a world of Web3 opportunities securely with a single sign-in.
          </div>
          <SIWEButton
            enableEthBranding={enableEthBranding}
            data-testid="connectWalletButton"
            onClick={() => connectWallet(connectDatastore)}
            className="col-span-2 mt-4 lg:w-3/4"
          />
        </div>
      </div>
      <WelcomeFooter displayPrivacyPolicy={true} />
    </PageRoot>
  );
}
