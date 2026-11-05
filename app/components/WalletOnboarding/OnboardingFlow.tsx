import React, { useContext, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { AppShell } from "@human.tech/ui/core";
import { PassportAccess, ScoreWindow, type PassportAccessProps } from "@human.tech/ui/passport";
import { DEFAULT_CUSTOMIZATION_KEY, useCustomization, useNavigateToPage } from "../../hooks/useCustomization";
import { useDatastoreConnectionContext } from "../../context/datastoreConnectionContext";
import { ScorerContext } from "../../context/scorerContext";
import { getOnboardingMock, useOnboardingScore } from "./mock";
import { markOnboardingSeen } from "../../utils/onboardingStatus";
import { isWaaPConnector } from "../../utils/waap";

type Step = "intro" | "score";
type OnboardingPage = NonNullable<PassportAccessProps["onboardingPage"]>;

// PassportAccess renders its built-in six-card onboarding deck (pages 0-5).
const LAST_ONBOARDING_PAGE: OnboardingPage = 5;

// Dev-only mockup preview: with a `?mock=nice|boost` param under `next dev`, render the
// whole flow without login/auth so the screens can be reviewed. Never active in production.
const isPreview = () => process.env.NODE_ENV === "development" && getOnboardingMock() !== null;

export const OnboardingFlow: React.FC = () => {
  const [step, setStep] = useState<Step>("intro");
  const [page, setPage] = useState<OnboardingPage>(0);
  const navigateToPage = useNavigateToPage();
  const preview = isPreview();

  const { address, connector } = useAccount();
  const { dbAccessToken, dbAccessTokenStatus } = useDatastoreConnectionContext();
  const { refreshScore } = useContext(ScorerContext);
  const { key } = useCustomization();
  const { rawScore, threshold, loading } = useOnboardingScore();

  // Route user to home when wallet is disconnected (skipped in dev mockup preview)
  useEffect(() => {
    if (preview) return;
    if (!address || dbAccessTokenStatus !== "connected") {
      navigateToPage("home");
    }
  }, [address, dbAccessTokenStatus, preview]);

  // Fetch score as soon as the flow mounts, so it's ready by the score step
  useEffect(() => {
    if (preview) return;
    if (address && dbAccessTokenStatus === "connected" && dbAccessToken) {
      const forceRescore = key !== DEFAULT_CUSTOMIZATION_KEY;
      refreshScore(address.toLowerCase(), dbAccessToken, forceRescore);
    }
  }, [address, dbAccessTokenStatus, dbAccessToken, key, preview]);

  // Reaching the score step (through the cards or Skip) counts as onboarding done for this account
  // on this device: its next login goes straight to the dashboard.
  useEffect(() => {
    if (preview || step !== "score" || !address) return;
    markOnboardingSeen(address);
  }, [step, address, preview]);

  const toDashboard = () => navigateToPage("dashboard");
  // Linked wallets belong to a Human Wallet account; other sign-ins can't open that page.
  const canLinkWallets = isWaaPConnector(connector);

  // Same framing as the design system's Passport walkthrough: the shared Passport/WaaP embed window.
  return (
    <AppShell brand="passport" size="embed">
      {step === "intro" ? (
        <PassportAccess
          state="onboarding"
          environment="human-tech"
          threshold={threshold}
          onboardingPage={page}
          onPrimary={() => (page < LAST_ONBOARDING_PAGE ? setPage((page + 1) as OnboardingPage) : setStep("score"))}
          onSkip={() => setStep("score")}
        />
      ) : (
        <ScoreWindow
          state={loading ? "loading" : rawScore >= threshold ? "verified" : "below"}
          score={rawScore}
          threshold={threshold}
          onContinue={toDashboard}
          continueLabel="View my Stamps"
          addVerificationsCta={{ onClick: toDashboard }}
          // ScoreWindow renders an inert button when the prop is left out; `hidden` drops it.
          linkIdentityCta={canLinkWallets ? { onClick: () => navigateToPage("linked-wallets") } : { hidden: true }}
          viewStampsCta={{ onClick: toDashboard }}
        />
      )}
    </AppShell>
  );
};
