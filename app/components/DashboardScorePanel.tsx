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

const PanelDiv = ({ className, children }: { className: string; children: React.ReactNode }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 w-full rounded-lg bg-gradient-to-t from-background to-[#082F2A] ${className}`}
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

const borderStyle = (color: string) => {
  return `shadow-${color} shadow-even-md border-${color} shadow-${color} border`;
};

export const DashboardScorePanel = ({ className }: { className?: string }) => {
  const { rawScore, passportSubmissionState, threshold } = React.useContext(ScorerContext);
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

  const loading = passportSubmissionState === "APP_REQUEST_PENDING" || verificationState.loading;
  const aboveThreshold = rawScore >= threshold;
  const highlightColor = aboveThreshold ? "foreground-2" : "background-5";

  return (
    <PanelDiv className={`${borderStyle(highlightColor)} text-color-2 font-heading ${className}`}>
      <div className="flex items-center w-full">
        <span className="grow">{customTitle || "Unique Humanity Score"}</span>
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
            <img
              src={aboveThreshold ? "/assets/scoreLogoSuccess.svg" : "/assets/scoreLogoBelow.svg"}
              alt={aboveThreshold ? "Above threshold Passport Logo" : "Below threshold Passport logo"}
            />
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
          <span className={`text-${highlightColor} text-5xl`}>{+displayScore.toFixed(2)}</span>
        )}
      </div>
    </PanelDiv>
  );
};

const LoadingBar = ({ className }: { className?: string }) => {
  return (
    <div
      className={`h-10 w-full bg-size-400 animate-[loading-gradient_5s_ease-in-out_infinite] bg-gradient-to-r from-background via-foreground-5 to-background rounded-lg my-2 ${className}`}
    />
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
      <h2 className={`text-xl text-foreground-2 ${!description && "mb-4"}`}>{title}</h2>
      {description && <p className="py-2">{description}</p>}
      {linkText && linkHref && <Hyperlink href={linkHref}>{linkText}</Hyperlink>}
    </div>
  );

  const renderButton = (text: string, onClick: () => void, className: string = "w-auto mt-4") => (
    <div className="flex w-full justify-end px-4">
      <LoadButton className={className} onClick={onClick}>
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
          "Congratulations. You have a passing score",
          "Next up, mint your passport onchain!",
          "Here’s what you can do with your passport!",
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
  const { passportSubmissionState } = React.useContext(ScorerContext);
  const [verificationState] = useAtom(mutableUserVerificationAtom);
  const [showSidebar, setShowSidebar] = React.useState(false);

  const loading = passportSubmissionState === "APP_REQUEST_PENDING" || verificationState.loading;

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
