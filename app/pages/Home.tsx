// --- React Methods
import React, { useEffect, useState } from "react";

// --- Components
import PageRoot from "../components/PageRoot";
import SIWEButton from "../components/SIWEButton";
import { isServerOnMaintenance } from "../utils/helpers";
import { WebmVideo } from "../components/WebmVideo";
import { DEFAULT_CUSTOMIZATION_KEY, useCustomization } from "../hooks/useCustomization";
import WelcomeFooter from "../components/WelcomeFooter";

import { useLoginFlow } from "../hooks/useLoginFlow";
import { useAppKitAccount } from "@reown/appkit/react";
import { AccountCenter } from "../components/AccountCenter";

export default function Home() {
  const { isLoggingIn, signIn, loginStep } = useLoginFlow();
  const { isConnected } = useAppKitAccount();
  const [enableEthBranding, setEnableEthBranding] = useState(false);
  const customization = useCustomization();

  useEffect(() => {
    const usingCustomization = customization.key !== DEFAULT_CUSTOMIZATION_KEY;
    setEnableEthBranding(!usingCustomization);
  }, [customization.key]);

  return (
    <PageRoot className="text-color-1 flex flex-col min-h-screen overflow-auto pb-32 md:pb-0">
      {isConnected && <AccountCenter />}
      <div className="flex-grow grid grid-rows-[2fr_auto_3fr] self-center p-8 overflow-auto">
        <div className="z-10 grid grid-flow-row row-start-2 grid-cols-2 gap-4 lg:grid-flow-col p-2">
          <div className="col-span-2 text-5xl md:text-7xl lg:row-start-2">
            <div className="grid grid-flow-col justify-start">
              <img src="./assets/passportLogoWhite.svg" alt="Icon" className="h-10 md:h-20 self-center" />
              <p className="p-2">Passport</p>
            </div>
          </div>
          <WebmVideo
            src="/assets/splashPageLogo.webm"
            fallbackSrc="/assets/splashPageLogoFallback.svg"
            alt="Passport Logo"
            className="col-span-2 w-full max-w-md lg:col-start-3 lg:row-span-6 lg:mr-8 lg:max-w-2xl"
          />
          <div className="col-span-2 mb-4 text-2xl leading-none text-foreground-2 md:text-5xl">
            Unlock the best of web3
          </div>
          <div className="col-span-2 max-w-md text-lg lg:max-w-sm">
            Access a world of Web3 opportunities securely with a single sign-in.
          </div>
          <div className="z-20 col-span-2 flex justify-center lg:justify-start items-center fixed left-0 w-full bottom-8 md:bottom-0 md:relative">
            <SIWEButton
              subtext={(() => {
                if (loginStep === "PENDING_WALLET_CONNECTION") {
                  return "Connect your wallet";
                } else if (loginStep === "PENDING_DATABASE_CONNECTION") {
                  return "Sign message in wallet";
                }
              })()}
              loadIconPosition="right"
              disabled={isLoggingIn || isServerOnMaintenance()}
              isLoading={isLoggingIn}
              enableEthBranding={enableEthBranding}
              data-testid="connectWalletButton"
              onClick={signIn}
              className="col-span-2 mt-4 lg:w-3/4"
            />
          </div>
        </div>
      </div>
      <WelcomeFooter displayPrivacyPolicy={true} />
    </PageRoot>
  );
}
