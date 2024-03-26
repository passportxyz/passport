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
    const usingCustomization = customization.key !== DEFAULT_CUSTOMIZATION_KEY;
    setEnableEthBranding(!usingCustomization);
    if (address) {
      if (checkShowOnboard()) {
        navigateToPage("welcome");
      } else {
        navigateToPage("dashboard");
      }
    }
  }, [address]);

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
    <PageRoot className="text-color-1">
      <div className="flex h-full min-h-default items-center justify-center self-center p-8">
        <img
          className="absolute bottom-0 right-0 z-0 h-auto w-full opacity-30 gradient-mask-t-0 md:h-[110%] md:w-auto md:gradient-mask-l-0"
          src="/assets/splashPageTexture.png"
          alt=""
        />
        <div className="z-10 grid grid-flow-row grid-cols-2 gap-4 lg:grid-flow-col">
          <div className="col-span-2 text-6xl md:text-7xl lg:row-start-2">Passport</div>
          <div className="col-span-2 mb-4 text-2xl leading-none text-foreground-2 md:text-5xl">
            Unlock the best of web3
          </div>
          <WebmVideo
            src="/assets/splashPageLogo.webm"
            fallbackSrc="/assets/splashPageLogoFallback.svg"
            alt="Passport Logo"
            className="col-span-2 w-full max-w-md lg:col-start-1 lg:row-span-6 lg:mr-8 lg:max-w-2xl"
          />
          <div className="col-span-2 max-w-md text-lg lg:max-w-sm">
            Passport helps you collect &ldquo;stamps&rdquo; that prove your humanity and reputation. You decide what
            stamps are shown. And your privacy is protected at each step of the way.
          </div>
          <SIWEButton
            enableEthBranding={enableEthBranding}
            data-testid="connectWalletButton"
            onClick={() => connectWallet(connectDatastore)}
            className="col-span-2 mt-4 lg:w-3/4"
          />
        </div>
      </div>
    </PageRoot>
  );
}
