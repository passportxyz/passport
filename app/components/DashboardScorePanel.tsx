import React, { useEffect } from "react";
import { ScorerContext } from "../context/scorerContext";

import { useCustomization } from "../hooks/useCustomization";
import { useAtom } from "jotai";
import { mutableUserVerificationAtom } from "../context/userState";
import Tooltip from "./Tooltip";
import { useAllOnChainStatus } from "../hooks/useOnChainStatus";
import { LoadButton } from "./LoadButton";
import { Hyperlink } from "@gitcoin/passport-platforms";
import { OnchainSidebar } from "./OnchainSidebar";
import { LoadingBar } from "./LoadingBar";

const PanelDiv = ({ className, children }: { className: string; children: React.ReactNode }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 w-full rounded-3xl bg-white text-black ${className}`}
    >
      {children}
    </div>
  );
};

const LoadingScoreImage = () => <img src="/assets/scoreLogoLoading.svg" alt="loading" className="h-20 w-auto" />;

const Ellipsis = () => {
  return (
    <div className="flex">
      .<div className="animate-[visible-at-one-third_1.5s_steps(1)_infinite]">.</div>
      <div className="animate-[visible-at-two-thirds_1.5s_steps(1)_infinite]">.</div>
    </div>
  );
};

export const DashboardScorePanel = ({ className }: { className?: string }) => {
  const { rawScore, scoreState, threshold } = React.useContext(ScorerContext);
  const [verificationState] = useAtom(mutableUserVerificationAtom);
  const [displayScore, setDisplayScore] = React.useState(0);
  const customization = useCustomization();

  // This enables the animation on page load
  useEffect(() => {
    if (verificationState.loading) {
      setDisplayScore(0);
    } else {
      setDisplayScore(rawScore);
    }
  }, [rawScore, verificationState.loading]);

  const customTitle = customization?.scorerPanel?.title;

  const loading = scoreState.status === "loading" || verificationState.loading;
  // const aboveThreshold = rawScore >= threshold;
  // const highlightColor = aboveThreshold ? "foreground-2" : "background-5";

  return (
    <PanelDiv className={`font-heading ${className}`}>
      <div className="flex items-center w-full">
        <span className="grow font-medium">{customTitle || "Unique Humanity Score"}</span>
        <Tooltip className="px-0">
          Your Unique Humanity Score is based out of 100 and measures your uniqueness. The current passing threshold is{" "}
          {threshold}. Scores may vary across different apps, especially due to abuse or attacks on the service.
        </Tooltip>
      </div>
      <div className="flex grow items-center align-middle text-xl mt-6 mb-10">
        <div className="m-4">
          {loading ? (
            <LoadingScoreImage />
          ) : (
            <img src="/assets/scoreLogoSuccess.svg" alt="Above threshold Passport Logo" />
          )}
        </div>
        {loading ? (
          <div className="leading-none">
            Updating
            <div className="flex">
              score
              <Ellipsis />
            </div>
          </div>
        ) : (
          <span className="text-5xl font-alt">{+displayScore.toFixed(2)}</span>
        )}
      </div>
    </PanelDiv>
  );
};

interface OnchainCTAProps {
  setShowSidebar: (show: boolean) => void;
}

export const OnchainCTA: React.FC<OnchainCTAProps> = ({ setShowSidebar }) => {
  const { rawScore, threshold } = React.useContext(ScorerContext);
  const { allChainsUpToDate } = useAllOnChainStatus();
  const customization = useCustomization();

  const aboveThreshold = rawScore >= threshold;
  const customText = customization?.scorerPanel?.text;

  const renderContent = (title: string, description?: string, linkText?: string, linkHref?: string) => (
    <div className="flex flex-col h-full w-full pt-10">
      <h2 className={`text-xl text-black ${!description && "mb-4"}`}>{title}</h2>
      {description && <p className="py-2">{description}</p>}
      {linkText && linkHref && <Hyperlink href={linkHref}>{linkText}</Hyperlink>}
    </div>
  );

  const renderButton = (text: string, onClick: () => void, className: string = "w-auto mt-4") => (
    <div className="flex w-full justify-end px-4">
      <LoadButton className={`${className} gap-0`} onClick={onClick}>
        <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7.5 6L12.5 11L17.5 6M7.5 13L12.5 18L17.5 13"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {text}
      </LoadButton>
    </div>
  );

  if (customText) {
    return renderContent(customText);
  }

  if (aboveThreshold && allChainsUpToDate) {
    return (
      <>
        {renderContent(
          "Congratulations. Your Passport is onchain.",
          undefined,
          "Here’s what you can do with your passport!",
          "https://www.passport.xyz/ecosystem"
        )}
        {renderButton("See onchain passport", () => setShowSidebar(true))}
      </>
    );
  }

  if (aboveThreshold) {
    return (
      <>
        {renderContent(
          "Congratulations. You have a passing Score",
          "Next up, mint your Passport onchain!",
          "Here’s what you can do with your Passport!",
          "https://www.passport.xyz/ecosystem"
        )}
        {renderButton("Mint onchain", () => setShowSidebar(true))}
      </>
    );
  }

  return (
    <>
      {renderContent(
        "Let's increase that score",
        undefined,
        "Here's some tips on how to raise your score to a minimum of 20.",
        "https://support.passport.xyz/passport-knowledge-base/stamps/scoring-20-for-humans"
      )}
      {renderButton("Verify Stamps", () => {
        const addStamps = document.getElementById("add-stamps");
        if (addStamps) {
          addStamps.scrollIntoView({ behavior: "smooth" });
        }
      })}
    </>
  );
};

export const DashboardScoreExplanationPanel = ({ className }: { className?: string }) => {
  const { scoreState } = React.useContext(ScorerContext);
  const [verificationState] = useAtom(mutableUserVerificationAtom);
  const [showSidebar, setShowSidebar] = React.useState(false);

  const loading = scoreState.status === "loading" || verificationState.loading;

  return (
    <>
      <PanelDiv className={`${className}`}>
        {loading ? (
          <div className="p-2 flex w-full flex-col gap-4">
            <LoadingBar className="w-full" />
            <LoadingBar className="w-full" />
            <LoadingBar className="w-2/3" />
          </div>
        ) : (
          <OnchainCTA setShowSidebar={() => setShowSidebar(true)} />
        )}
      </PanelDiv>
      <OnchainSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};
