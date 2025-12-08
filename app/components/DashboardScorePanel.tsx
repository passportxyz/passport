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
import { OnChainStatus } from "../utils/onChainStatus";

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
        <Tooltip className="px-0 self-start">
          Your Unique Humanity Score measures your uniqueness. The current passing threshold is {threshold}. Scores may
          vary across different apps, as partners can weight Stamps differently.
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
          <span className="text-5xl font-alt font-semibold">{+displayScore.toFixed(2)}</span>
        )}
      </div>
    </PanelDiv>
  );
};

interface OnchainCTAProps {
  setShowSidebar: (show: boolean) => void;
}

const IconHammer: React.FC = () => (
  <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15.5001 12.9033L7.12706 21.2763C6.72923 21.6741 6.18967 21.8976 5.62706 21.8976C5.06445 21.8976 4.52488 21.6741 4.12706 21.2763C3.72923 20.8785 3.50574 20.3389 3.50574 19.7763C3.50574 19.2137 3.72923 18.6741 4.12706 18.2763L12.5001 9.90328M18.5001 15.9033L22.5001 11.9033M22.0001 12.4033L20.0861 10.4893C19.711 10.1143 19.5002 9.60567 19.5001 9.07528V7.90328L17.2401 5.64328C16.1246 4.52847 14.6151 3.89764 13.0381 3.88728L9.50006 3.86328L10.4201 4.68328C11.0735 5.26267 11.5968 5.97398 11.9553 6.77033C12.3138 7.56667 12.4995 8.42995 12.5001 9.30328V10.9033L14.5001 12.9033H15.6721C16.2024 12.9034 16.7111 13.1142 17.0861 13.4893L19.0001 15.4033"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const IconArrowDown: React.FC = () => (
  <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.5 6L12.5 11L17.5 6M7.5 13L12.5 18L17.5 13"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const OnchainCTA: React.FC<OnchainCTAProps> = ({ setShowSidebar }) => {
  const { rawScore, threshold } = React.useContext(ScorerContext);
  const { someChainUpToDate, onChainAttestationProviders } = useAllOnChainStatus();
  const customization = useCustomization();

  const aboveThreshold = rawScore >= threshold;
  const customText = customization?.scorerPanel?.text;

  const renderContent = (
    title: string,
    description?: string,
    linkText?: string,
    linkHref?: string,
    button?: React.ReactNode
  ) => (
    <div className="w-full h-full p-2 flex flex-col">
      <div className="flex flex-col h-full w-full">
        <div className="flex flex-col md:flex-row items-start justify-between flex-wrap">
          <div className="flex justify-start">
            <h2 className={`text-2xl text-black font-semibold pr-4 text-nowrap ${!description && "mb-4"}`}>{title}</h2>
          </div>
        </div>
        <p className="py-2 self-center md:self-start">{description}</p>
      </div>
      <div className="w-full flex flex-col md:flex-row justify-between items-center">
        <div className="flex flex-row items-center gap-2">{button}</div>
        {linkText && linkHref && (
          <Hyperlink href={linkHref} className="font-normal text-gray-500 pl-4">
            {linkText}
          </Hyperlink>
        )}
      </div>
    </div>
  );

  const renderButton = (text: string, onClick: () => void, icon: React.ReactElement) => (
    <LoadButton className="gap-0" onClick={onClick}>
      {icon}
      {text}
    </LoadButton>
  );

  if (customText) {
    return renderContent(customText);
  }

  if (aboveThreshold && someChainUpToDate) {
    return (
      <div className="w-full h-full p-2 flex flex-col">
        <div className="flex flex-col h-full w-full">
          <div className="flex flex-col md:flex-row items-start justify-between flex-wrap">
            <div className="flex justify-start">
              <h2 className="text-2xl text-black font-semibold pr-4 text-nowrap">Passport minted!</h2>
            </div>
            <div className="flex w-full md:w-auto justify-center gap-0">
              {onChainAttestationProviders?.map(({ attestationProvider, status }, idx) => {
                const isExpired = status === OnChainStatus.MOVED_EXPIRED;
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="relative flex flex-col items-center w-[70px] h-[80px] bg-center bg-[url(/assets/onchain-shield.svg)]">
                      <img src={attestationProvider?.icon} alt="attestation-provider" className="m-auto max-w-6"></img>
                      <div
                        className={`${isExpired ? "" : "hidden"} bg-white bg-opacity-50 absolute h-full w-full`}
                      ></div>
                    </div>
                    <span
                      className={`${isExpired ? "" : "hidden"} bg-color-9 text-white p-0 m-0 align-middle rounded-full px-2 relative -top-7`}
                    >
                      Expired
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="py-2 self-center md:self-start">
            Success! Mint on other networks to maximize your onchain presence.
          </p>
        </div>
        <div className="w-full flex flex-col md:flex-row justify-between items-center">
          <span className="text-nowrap">
            {renderButton("Open Minting Dashboard", () => setShowSidebar(true), <IconHammer />)}
          </span>
          <Hyperlink href="https://www.passport.xyz/ecosystem" className="font-normal text-gray-500 pl-4">
            <span className="text-nowrap">Here&apos;s what you can</span>{" "}
            <span className="text-nowrap">do with your Passport.</span>
          </Hyperlink>
        </div>
      </div>
    );
  }

  if (aboveThreshold) {
    return (
      <>
        {renderContent(
          "Congrats! You have a passing Unique Humanity Score!",
          "Next up, mint your Passport onchain!",
          "Here's what you can do with your Passport!",
          "https://www.passport.xyz/ecosystem",
          renderButton("Mint onchain", () => setShowSidebar(true), <IconHammer />)
        )}
      </>
    );
  }

  return (
    <>
      {renderContent(
        "Let's increase that Unique Humanity Score",
        "You will need at least 20 points to verify your humanity",
        "Here's some tips on how to raise your Unique Humanity Score",
        "https://support.passport.xyz/passport-knowledge-base/stamps/scoring-20-for-humans",
        renderButton(
          "Verify Stamps",
          () => {
            const addStamps = document.getElementById("add-stamps");
            if (addStamps) {
              addStamps.scrollIntoView({ behavior: "smooth" });
            }
          },
          <IconArrowDown />
        )
      )}
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
