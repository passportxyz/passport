// --- React Methods
import React, { useEffect, useState } from "react";

// --- Components
import SIWEButton from "../components/SIWEButton";
import { isServerOnMaintenance } from "../utils/helpers";

import { DEFAULT_CUSTOMIZATION_KEY, useCustomization } from "../hooks/useCustomization";

import { useLoginFlow } from "../hooks/useLoginFlow";
import { InitialScreenWelcome } from "../components/InitialScreenLayout";

export default function Home() {
  const { isLoggingIn, signIn, loginStep } = useLoginFlow();
  const [enableEthBranding, setEnableEthBranding] = useState(false);
  const customization = useCustomization();
  const threshold = customization.scorer?.threshold;

  useEffect(() => {
    const usingCustomization = customization.key !== DEFAULT_CUSTOMIZATION_KEY;
    setEnableEthBranding(!usingCustomization);
  }, [customization.key]);

  // customization.scorer?.weights

  return (
    <InitialScreenWelcome imgUrl="/assets/hmnWelcomeImage.svg">
      <div className="mb-4 text-2xl leading-none md:text-6xl font-bold font-alt">Verify Your Humanity, Your Way</div>
      <div className="max-w-md text-lg">
        Collect Stamps, build your Unique Humanity Score of {!!threshold ? threshold : "20+"}, and access the internet
        built for humans.
      </div>

      <div className="flex justify-center md:justify-start items-center w-full mb-8">
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
          className="px-10 mmb-12 md:w-2/3"
        />
      </div>
    </InitialScreenWelcome>
  );
}
