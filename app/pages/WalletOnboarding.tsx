import React from "react";
import PageRoot from "../components/PageRoot";
import Header from "../components/Header";
import WelcomeFooter from "../components/WelcomeFooter";
import { OnboardingFlow } from "../components/WalletOnboarding/OnboardingFlow";

export default function WalletOnboarding() {
  return (
    <PageRoot className="flex min-h-screen flex-col overflow-auto text-color-1">
      <Header skipCustomisation={true} />
      <div className="relative flex flex-1 items-center justify-center px-4 pb-24 pt-24 md:pb-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(closest-side, #EBFFF7, rgba(235,255,247,0))",
          }}
        />
        <div className="relative z-10">
          <OnboardingFlow />
        </div>
      </div>
      <WelcomeFooter displayPrivacyPolicy={true} />
    </PageRoot>
  );
}
