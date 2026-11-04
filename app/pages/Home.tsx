// --- React Methods
import React, { useCallback, useEffect, useRef, useState } from "react";

// --- Components
import SIWEButton from "../components/SIWEButton";
import { isServerOnMaintenance } from "../utils/helpers";

import { DEFAULT_CUSTOMIZATION_KEY, useCustomization } from "../hooks/useCustomization";

import { useLoginFlow } from "../hooks/useLoginFlow";
import { InitialScreenWelcome } from "../components/InitialScreenLayout";
import { hasValidStoredSession } from "../context/datastoreConnectionContext";
import { useAccount } from "wagmi";

// --- Analytics
import posthog from "posthog-js";

export default function Home() {
  const { address, isConnected } = useAccount();
  // Shared with the header's Connect Wallet (LoginFlowProvider): one login, one loading state, and
  // the provider decides where to go after it.
  const { isBusy, signIn, loginStep } = useLoginFlow();
  const [enableEthBranding, setEnableEthBranding] = useState(false);
  const customization = useCustomization();
  const threshold = customization.scorer?.threshold;

  useEffect(() => {
    const usingCustomization = customization.key !== DEFAULT_CUSTOMIZATION_KEY;
    setEnableEthBranding(!usingCustomization);
  }, [customization.key]);

  // After a refresh the wallet reconnects on its own. If this address still has a valid Passport
  // session, resume it (no new signature) instead of leaving the user on the sign-in screen.
  const resumedSession = useRef(false);
  useEffect(() => {
    if (resumedSession.current || !isConnected || !address || loginStep !== "NOT_STARTED") return;
    if (!hasValidStoredSession(address)) return;
    resumedSession.current = true;
    signIn();
  }, [isConnected, address, loginStep, signIn]);

  // The only sign-in: WaaP's window, with email, phone, social or an external wallet.
  const handleConnectWallet = useCallback(() => {
    posthog.capture("cta_clicked", { site: "passport.human.tech", cta_id: "connect_wallet" });
    signIn({ useWaap: true });
  }, [signIn]);

  // customization.scorer?.weights

  return (
    <InitialScreenWelcome imgUrl="/assets/hmnWelcomeImage.svg">
      <div className="mb-4 text-2xl leading-none md:text-6xl font-bold font-alt">Verify Your Humanity, Your Way</div>
      <div className="max-w-md text-lg">
        Collect Stamps, build your Unique Humanity Score of {!!threshold ? threshold : "20+"}, and access the internet
        built for humans.
      </div>

      <div className="flex flex-col justify-center md:justify-start items-center md:items-start gap-4 w-full mb-8">
        <SIWEButton
          subtext={(() => {
            if (loginStep === "PENDING_WALLET_CONNECTION") {
              return "Connect your wallet";
            } else if (loginStep === "PENDING_DATABASE_CONNECTION") {
              return "Sign message in wallet";
            }
          })()}
          loadIconPosition="left"
          disabled={isBusy || isServerOnMaintenance()}
          isLoading={isBusy}
          enableEthBranding={enableEthBranding}
          data-testid="connectWalletButton"
          onClick={handleConnectWallet}
          className="px-10 mmb-12 md:w-2/3"
        />
      </div>

      {/* Dev-only shortcuts to the onboarding mockup preview (see WalletOnboarding/mock.ts). */}
      {process.env.NODE_ENV === "development" && (
        <div data-testid="onboardingPreviewLinks" className="flex flex-wrap items-center gap-3 text-sm text-color-9">
          <span>Dev preview:</span>
          <a className="underline" href="#/wallet-onboarding?mock=boost">
            Onboarding (below threshold)
          </a>
          <a className="underline" href="#/wallet-onboarding?mock=nice">
            Onboarding (verified)
          </a>
        </div>
      )}
    </InitialScreenWelcome>
  );
}
