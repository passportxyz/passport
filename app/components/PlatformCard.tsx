// --- React Methods
import React, { useState, useContext, useEffect } from "react";

// --- Types
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

// --- Components
import { Button } from "./Button";
import { PlatformScoreSpec } from "../context/scorerContext";
import { CeramicContext } from "../context/ceramicContext";
import { ProgressBar } from "./ProgressBar";
import { getDaysToExpiration } from "../utils/duration";
import { usePlatforms } from "../hooks/usePlatforms";
import { useStampDeduplication } from "../hooks/useStampDeduplication";
import { useOnChainData } from "../hooks/useOnChainData";
import { ExpiredLabel } from "./LabelExpired";
import { PassportPoints } from "./PassportPoints";
import { useCustomization } from "../hooks/useCustomization";
import { BetaBadge } from "./BetaBadge";

export type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

type PlatformCardProps = {
  i: number;
  platform: PlatformScoreSpec;
  onOpen: () => void;
  setCurrentPlatform: React.Dispatch<React.SetStateAction<PlatformScoreSpec | undefined>>;
  className?: string;
};

type StampProps = {
  idx: number;
  platform: PlatformScoreSpec;
  platformProviders: PROVIDER_ID[];
  daysUntilExpiration?: number;
  className?: string;
  onClick: () => void;
  isDeduplicated?: boolean;
  isHumanTech?: boolean;
  isBeta?: boolean;
};

const humanTechPlatforms = new Set<string>([
  "Proof of Clean Hands",
  "Government ID",
  "Phone Verification",
  "Biometrics",
]);
const SecureDByHumanTech: React.FC = () => {
  return (
    <div className="flex flex-nowrap items-center rounded-full bg-white px-2 py-0.5 w-fit text-color-9 text-xs my-2">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M14.1917 8.48C14.0921 8.44075 13.9894 8.40302 13.8838 8.36528C13.603 8.26566 13.2996 8.17509 12.9796 8.0966C12.9826 8.03321 12.9826 7.96679 12.9796 7.9034C13.2996 7.82491 13.603 7.73434 13.8838 7.63472C13.9909 7.59698 14.0951 7.55774 14.1947 7.51849C15.2996 7.07623 16 6.48 16 5.73585C16 4.8483 15.0038 4.17208 13.5155 3.71623C13.2091 3.62113 12.88 3.5366 12.5358 3.46415C12.4634 3.12 12.3789 2.79094 12.2838 2.48453C11.8279 0.996226 11.1517 0 10.2642 0C9.52 0 8.92377 0.700377 8.48151 1.80528C8.44226 1.90491 8.40302 2.00906 8.36528 2.11623C8.26717 2.39698 8.1766 2.70038 8.0966 3.02038C8.03321 3.01887 7.96679 3.01887 7.9034 3.02038C7.82491 2.70038 7.73434 2.39698 7.63472 2.11623C7.59698 2.01057 7.55925 1.90792 7.52 1.8083C7.07774 0.701887 6.48 0 5.73585 0C4.8483 0 4.17208 0.996226 3.71623 2.48604C3.62264 2.79245 3.53811 3.12 3.46264 3.46415C3.11849 3.53811 2.79094 3.62264 2.48604 3.71623C0.996226 4.17208 0 4.8483 0 5.73585C0 6.48 0.700377 7.07623 1.80679 7.51849C1.90642 7.55774 2.00906 7.59698 2.11623 7.63321C2.39698 7.73283 2.69887 7.8234 3.02038 7.9034C3.01887 7.96679 3.01887 8.03321 3.02038 8.0966C2.69887 8.1766 2.39698 8.26717 2.11623 8.36679C2.01057 8.40302 1.90792 8.44075 1.80981 8.48C0.701887 8.92226 0 9.51849 0 10.2642C0 11.1517 0.996226 11.8279 2.48604 12.2838C2.79094 12.3774 3.11849 12.4619 3.46264 12.5358C3.5366 12.8785 3.62113 13.206 3.71623 13.5125C4.17057 15.0023 4.8483 16 5.73585 16C6.48 16 7.07774 15.2981 7.52 14.1917C7.55925 14.0921 7.59698 13.9894 7.63472 13.8838C7.73434 13.603 7.82491 13.2996 7.9034 12.9796C7.96679 12.9811 8.03321 12.9811 8.0966 12.9796C8.1766 13.2996 8.26717 13.603 8.36528 13.8838C8.40302 13.9909 8.44226 14.0951 8.48151 14.1947C8.92377 15.2996 9.52 16 10.2642 16C11.1517 16 11.8279 15.0038 12.2838 13.514C12.3789 13.2075 12.4634 12.88 12.5358 12.5358C12.88 12.4634 13.2091 12.3789 13.5155 12.2838C15.0038 11.8279 16 11.1517 16 10.2642C16 9.52 15.2981 8.92226 14.1917 8.48ZM8.81057 3.9366C9.11698 3.94566 9.43547 3.96075 9.7283 3.98189C10.1162 4.00755 10.48 4.04226 10.8226 4.08453C10.7502 3.73132 10.6717 3.42189 10.5902 3.15321C10.3804 3.13208 10.1691 3.11245 9.95472 3.09585C9.6483 3.07019 9.33736 3.05208 9.02491 3.04C9.12 2.69887 9.22264 2.40151 9.32679 2.14641C9.67396 1.29811 10.0408 0.90566 10.2642 0.90566C10.5011 0.90566 10.9042 1.35245 11.2694 2.32302C11.597 3.19245 11.7962 4.20226 11.9155 5.17736C11.9577 5.52 11.9925 5.88377 12.0181 6.2717C12.3532 6.20075 12.6475 6.12377 12.9042 6.04528C12.8875 5.83094 12.8679 5.61962 12.8468 5.40981C12.8106 5.07623 12.7668 4.74868 12.717 4.4317C13.0808 4.52377 13.4008 4.62491 13.677 4.73057C14.6475 5.09585 15.0943 5.49887 15.0943 5.73585C15.0943 5.95925 14.7019 6.32604 13.8536 6.67321C13.0385 7.00377 12.0679 7.21358 11.1608 7.3434C10.6838 7.41132 10.157 7.46415 9.5834 7.49887C9.42038 6.98566 9.01585 6.57962 8.50113 6.4166C8.53585 5.84302 8.58868 5.31623 8.6566 4.83925C8.70189 4.51774 8.75321 4.21585 8.81057 3.9366ZM2.14641 6.67321C1.29811 6.32604 0.90566 5.95925 0.90566 5.73585C0.90566 5.49887 1.35245 5.09585 2.32302 4.73057C3.19245 4.40302 4.20226 4.20377 5.17736 4.08453C5.52 4.04226 5.88377 4.00755 6.2717 3.98189C6.20075 3.64679 6.12377 3.35245 6.04528 3.09585C5.83094 3.11245 5.61962 3.13208 5.40981 3.15321C5.07623 3.18943 4.74868 3.23321 4.4317 3.28302C4.52377 2.91925 4.62642 2.59925 4.73057 2.32302C5.09585 1.35245 5.49887 0.90566 5.73585 0.90566C5.95925 0.90566 6.32604 1.29811 6.67321 2.14641C7.00377 2.96151 7.21358 3.93208 7.3434 4.83925C7.41132 5.31623 7.46264 5.84302 7.49887 6.4166C6.98566 6.57962 6.57962 6.98415 6.4166 7.49887C5.84302 7.46415 5.31623 7.41132 4.83925 7.3434C4.51774 7.29811 4.21585 7.24679 3.9366 7.18943C3.94566 6.88302 3.96075 6.56453 3.98189 6.2717C4.00755 5.88377 4.04226 5.52 4.08453 5.17736C3.73132 5.25132 3.42189 5.32981 3.15321 5.40981C3.13208 5.61811 3.11245 5.82943 3.09585 6.04377C3.07019 6.35019 3.05208 6.66113 3.04 6.97509C2.69887 6.88 2.40151 6.77736 2.14641 6.67321ZM7.18943 12.0634C6.88302 12.0543 6.56453 12.0392 6.2717 12.0181C5.88377 11.9925 5.52 11.9577 5.17736 11.9155C5.24981 12.2687 5.3283 12.5781 5.40981 12.8468C5.61962 12.8679 5.83094 12.8875 6.04528 12.9042C6.3517 12.9298 6.66264 12.9479 6.97509 12.96C6.88 13.3011 6.77736 13.5985 6.67321 13.8536C6.32604 14.7019 5.95925 15.0943 5.73585 15.0943C5.49887 15.0943 5.09585 14.6475 4.73057 13.677C4.40302 12.8075 4.20226 11.7977 4.08453 10.8226C4.04226 10.48 4.00755 10.1162 3.98189 9.7283C3.64679 9.79924 3.35245 9.87774 3.09585 9.95623C3.11245 10.1706 3.13208 10.3819 3.15321 10.5902C3.18943 10.9238 3.23321 11.2513 3.28302 11.5683C2.91925 11.4762 2.59925 11.3736 2.32302 11.2694C1.35245 10.9042 0.90566 10.5011 0.90566 10.2642C0.90566 10.0408 1.29811 9.67396 2.14641 9.32679C2.96755 8.99321 3.92302 8.78641 4.83925 8.6566C5.31774 8.58868 5.84453 8.53585 6.4166 8.50113C6.57962 9.01434 6.98415 9.42038 7.49887 9.5834C7.46415 10.157 7.41132 10.6838 7.3434 11.1608C7.29811 11.4823 7.24679 11.7842 7.18943 12.0634ZM13.677 11.2694C12.8075 11.597 11.7977 11.7977 10.8226 11.9155C10.48 11.9577 10.1162 11.9925 9.7283 12.0181C9.79924 12.3532 9.87623 12.6475 9.95472 12.9042C10.1691 12.8875 10.3804 12.8679 10.5902 12.8468C10.9238 12.8106 11.2513 12.7668 11.5683 12.717C11.4762 13.0808 11.3751 13.4008 11.2694 13.677C10.9042 14.6475 10.5011 15.0943 10.2642 15.0943C10.0408 15.0943 9.67396 14.7019 9.32679 13.8536C8.99321 13.0325 8.78641 12.077 8.6566 11.1608C8.58868 10.6838 8.53736 10.157 8.50113 9.5834C9.01434 9.42038 9.42038 9.01585 9.5834 8.50113C10.157 8.53585 10.6838 8.58868 11.1608 8.6566C11.4823 8.70189 11.7842 8.75321 12.0634 8.81057C12.0543 9.11698 12.0392 9.43547 12.0181 9.7283C11.9925 10.1162 11.9577 10.48 11.9155 10.8226C12.2687 10.7502 12.5781 10.6717 12.8468 10.5902C12.8679 10.3804 12.8875 10.1691 12.9042 9.95472C12.9298 9.6483 12.9479 9.33736 12.96 9.02491C13.3011 9.12 13.5985 9.22264 13.8536 9.32679C14.7019 9.67396 15.0943 10.0408 15.0943 10.2642C15.0943 10.5011 14.6475 10.9042 13.677 11.2694Z"
          fill="#929292"
        />
      </svg>
      <span className="pl-1 pt-0.5">Secured by human.tech</span>
    </div>
  );
};

const DefaultStamp = ({ idx, platform, className, onClick, isHumanTech, isBeta }: StampProps) => {
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div className="group relative flex h-full cursor-pointer flex-col rounded-2xl p-0 transition-all duration-200 hover:scale-[1.01] hover:shadow-md bg-background">
        <div className="m-4 flex h-full flex-col justify-between">
          <div className="flex w-full items-center justify-between">
            {platform.icon ? (
              <div>
                <img src={platform.icon} alt={platform.name} className="h-10 w-10" />
              </div>
            ) : (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24.7999 24.8002H28.7999V28.8002H24.7999V24.8002ZM14 24.8002H18V28.8002H14V24.8002ZM3.19995 24.8002H7.19995V28.8002H3.19995V24.8002ZM24.7999 14.0002H28.7999V18.0002H24.7999V14.0002ZM14 14.0002H18V18.0002H14V14.0002ZM3.19995 14.0002H7.19995V18.0002H3.19995V14.0002ZM24.7999 3.2002H28.7999V7.2002H24.7999V3.2002ZM14 3.2002H18V7.2002H14V3.2002ZM3.19995 3.2002H7.19995V7.2002H3.19995V3.2002Z"
                  fill="var(--color-muted)"
                />
              </svg>
            )}

            <PassportPoints
              points={Math.max(platform.displayPossiblePoints - platform.earnedPoints, 0)}
              className="text-right"
            />
          </div>

          <div className="mt-4 h-full md:mt-6 inline-block justify-start text-color-4">
            <div
              className={`flex place-items-start flex-row gap-2 mr-0 md:mr-4 ${
                platform.name.split(" ").length > 1 ? "items-center md:items-baseline" : "items-center"
              }`}
            >
              <h1
                data-testid="platform-name"
                className={`text-xl ${platform.name.split(" ").length > 1 ? "text-left" : "text-center"}`}
              >
                {platform.name}
              </h1>
              {isBeta && <BetaBadge />}
            </div>
            {isHumanTech && <SecureDByHumanTech />}
            <p className="flex-1 pleading-relaxed mt-2 text-sm inline-block visible text-gray-600">
              {platform.description}
            </p>
          </div>
          <Button
            data-testid="connect-button"
            variant="custom"
            className="mt-5 w-auto bg-transparent bg-white text-color-4 border-foreground-2 z-10"
          >
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
};

const VerifiedStamp = ({
  idx,
  platform,
  platformProviders,
  daysUntilExpiration,
  className,
  onClick,
  isDeduplicated,
  isHumanTech,
  isBeta,
}: StampProps) => {
  const { activeChainProviders } = useOnChainData();
  const [isAnyOnchain, setIsAnyOnchain] = useState(false);

  useEffect(() => {
    const onchainProviderSet = new Set(activeChainProviders.map((p) => p.providerName));
    const providerSet = new Set(platformProviders);
    const intersection = onchainProviderSet.intersection(providerSet);
    setIsAnyOnchain(intersection.size > 0);
  }, [activeChainProviders, platformProviders]);

  const style = {
    boxShadow: "0px 4px 16px 0px #0E865066",
  };
  return (
    <div
      data-testid="platform-card"
      onClick={onClick}
      className={`${className} rounded-2xl`}
      key={`${platform.name}${idx}`}
      style={style}
    >
      <div className="group relative flex h-full cursor-pointer flex-col rounded-2xl p-0 transition-all ease-out bg-emerald-100">
        <div className="m-4 flex h-full flex-col justify-between">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              {platform.icon ? (
                <div>
                  <img src={platform.icon} alt={platform.name} className="h-10 w-10" />
                </div>
              ) : (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M24.7999 24.8002H28.7999V28.8002H24.7999V24.8002ZM14 24.8002H18V28.8002H14V24.8002ZM3.19995 24.8002H7.19995V28.8002H3.19995V24.8002ZM24.7999 14.0002H28.7999V18.0002H24.7999V14.0002ZM14 14.0002H18V18.0002H14V14.0002ZM3.19995 14.0002H7.19995V18.0002H3.19995V14.0002ZM24.7999 3.2002H28.7999V7.2002H24.7999V3.2002ZM14 3.2002H18V7.2002H14V3.2002ZM3.19995 3.2002H7.19995V7.2002H3.19995V3.2002Z"
                    fill="var(--color-muted)"
                  />
                </svg>
              )}
              {/* <StampLabels primaryLabel="Verified" primaryBgColor="bg-foreground-4" isDeduplicated={isDeduplicated} /> */}
              {isDeduplicated || (
                <div className="pl-3 pr-2 py-1 text-md font-medium text-left text-emerald-600">
                  <p data-testid="verified-label">{isAnyOnchain ? "Minted" : "Verified"}</p>
                </div>
              )}
              {isDeduplicated && (
                <div className="pl-3 pr-2 py-1 text-l font-medium text-left text-emerald-600">
                  <a
                    href="https://support.passport.xyz/passport-knowledge-base/common-questions/why-am-i-receiving-zero-points-for-a-verified-stamp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <p data-testid="deduped-label">Deduplicated</p>
                  </a>
                </div>
              )}
            </div>

            <PassportPoints points={platform.earnedPoints} prefix="+" className="text-right" />
          </div>

          <div className="mt-4 h-full md:mt-6 inline-block justify-start text-color-4">
            <div
              className={`flex place-items-start flex-row gap-2 ${
                platform.name.split(" ").length > 1 ? "items-center md:items-baseline" : "items-center"
              }`}
            >
              <h1
                data-testid="platform-name"
                className={`mr-0 text-xl md:mr-4 ${platform.name.split(" ").length > 1 ? "text-left" : "text-center"}`}
              >
                {platform.name}
              </h1>
              {isBeta && <BetaBadge />}
            </div>
            {isHumanTech && <SecureDByHumanTech />}
            <p className="flex-1 pleading-relaxed mt-2 text-sm inline-block visible text-gray-600">
              {platform.description}
            </p>
          </div>

          <div className="text-sm font-medium text-color-9">
            <span className="text-xl text-color-4">{+platform.earnedPoints.toFixed(1)}</span>/
            {+platform.displayPossiblePoints.toFixed(1)} points gained
          </div>
          <ProgressBar
            pointsGained={platform.earnedPoints}
            pointsAvailable={Math.max(platform.displayPossiblePoints - platform.earnedPoints, 0)}
            isSlim={true}
          />
          <div className="flex flex-row justify-center px-4 pt-2 mt-2">
            <div>
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.5 12.332C3.5 14.1121 4.02784 15.8521 5.01677 17.3322C6.00571 18.8122 7.41131 19.9658 9.05585 20.6469C10.7004 21.3281 12.51 21.5064 14.2558 21.1591C16.0016 20.8118 17.6053 19.9547 18.864 18.696C20.1226 17.4373 20.9798 15.8337 21.3271 14.0878C21.6743 12.342 21.4961 10.5324 20.8149 8.88788C20.1337 7.24335 18.9802 5.83774 17.5001 4.8488C16.0201 3.85987 14.28 3.33203 12.5 3.33203C9.98395 3.3415 7.56897 4.32325 5.76 6.07203L3.5 8.33203M3.5 8.33203V3.33203M3.5 8.33203H8.5M12.5 7.33203V12.332L16.5 14.332"
                  stroke="black"
                  strokeOpacity="0.5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="pl-2 text-color-9 override-text-color">
              Valid for {daysUntilExpiration} {daysUntilExpiration === 1 ? "day" : "days"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpiredStamp = ({
  idx,
  platform,
  daysUntilExpiration,
  className,
  onClick,
  isDeduplicated,
  isHumanTech,
  isBeta,
}: StampProps) => {
  const [hovering, setHovering] = useState(false);
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="group relative flex h-full cursor-pointer flex-col rounded-2xl p-0 bg-[#e5e5e5]"
      >
        <div className="m-4 flex h-full flex-col justify-between">
          <div className="flex w-full items-center justify-between">
            {platform.icon ? (
              <img src={platform.icon} alt={platform.name} className="h-10 w-10" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24.7999 24.8002H28.7999V28.8002H24.7999V24.8002ZM14 24.8002H18V28.8002H14V24.8002ZM3.19995 24.8002H7.19995V28.8002H3.19995V24.8002ZM24.7999 14.0002H28.7999V18.0002H24.7999V14.0002ZM14 14.0002H18V18.0002H14V14.0002ZM3.19995 14.0002H7.19995V18.0002H3.19995V14.0002ZM24.7999 3.2002H28.7999V7.2002H24.7999V3.2002ZM14 3.2002H18V7.2002H14V3.2002ZM3.19995 3.2002H7.19995V7.2002H3.19995V3.2002Z"
                  fill="var(--color-muted)"
                />
              </svg>
            )}
            <ExpiredLabel />
          </div>
          <div className="mt-4 h-full md:mt-6 inline-block justify-start text-color-4">
            <div
              className={`flex place-items-start flex-row gap-2 ${
                platform.name.split(" ").length > 1 ? "items-center md:items-baseline" : "items-center"
              }`}
            >
              <h1
                data-testid="platform-name"
                className={`mr-0 text-xl md:mr-4 ${platform.name.split(" ").length > 1 ? "text-left" : "text-center"}`}
              >
                {platform.name}
              </h1>
              {isBeta && <BetaBadge />}
            </div>
            {isHumanTech && <SecureDByHumanTech />}
            <p className="flex-1 pleading-relaxed mt-2 text-sm inline-block visible text-gray-600">
              {platform.description}
            </p>
          </div>
          <div className="text-sm font-bold text-color-9">
            <span className="text-xl text-color-4">{+platform.earnedPoints.toFixed(1)}</span>/
            {platform.displayPossiblePoints.toFixed(1)} points gained
          </div>{" "}
          <ProgressBar
            pointsGained={platform.earnedPoints}
            pointsAvailable={Math.max(platform.displayPossiblePoints - platform.earnedPoints, 0)}
            isSlim={true}
            gainedBarColor={"#737373"}
          />
          <Button
            data-testid="update-button"
            variant="custom"
            className="mt-5 w-auto bg-transparent bg-white text-color-4 border-foreground-2 z-10"
          >
            Update
          </Button>
        </div>
      </div>
    </div>
  );
};

export const PlatformCard = ({
  i,
  platform,
  onOpen,
  setCurrentPlatform,
  className,
}: PlatformCardProps): JSX.Element => {
  const { platformExpirationDates, expiredPlatforms, allProvidersState } = useContext(CeramicContext);
  const { platformSpecs, platformProviderIds } = usePlatforms();
  const { betaStamps } = useCustomization();

  const selectedProviders = platformSpecs.reduce((platforms, platform) => {
    const providerIds = platformProviderIds[platform.platform] || [];
    platforms[platform.platform] = providerIds.filter(
      (providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined"
    );
    return platforms;
  }, {} as SelectedProviders);

  const isExpired: boolean = platform.platform in expiredPlatforms;

  const daysUntilExpiration = getDaysToExpiration({
    expirationDate: platformExpirationDates[platform.platform as PLATFORM_ID] || "",
  });

  // Use the custom hook to determine if this platform has deduplicated stamps
  const isDeduplicated = useStampDeduplication(platform);
  const isHumanTech = humanTechPlatforms.has(platform.name);

  // Check if any of this platform's providers are in beta
  const platformProviders = platformProviderIds[platform.platform] || [];
  const isBeta = platformProviders.some((providerId) => betaStamps?.has(providerId));

  const verified =
    platform.earnedPoints > 0 ||
    (selectedProviders[platform.platform] && selectedProviders[platform.platform].length > 0);

  // returns a single Platform card
  let stamp = null;
  if (verified && isExpired) {
    stamp = (
      <ExpiredStamp
        idx={i}
        platform={platform}
        platformProviders={platformProviderIds[platform.platform]}
        className={className}
        isDeduplicated={isDeduplicated}
        isHumanTech={isHumanTech}
        isBeta={isBeta}
        onClick={() => {
          setCurrentPlatform(platform);
          onOpen();
        }}
      />
    );
  } else if (verified) {
    // The not-verified & not-expired state of the card
    stamp = (
      <VerifiedStamp
        idx={i}
        platform={platform}
        platformProviders={platformProviderIds[platform.platform]}
        daysUntilExpiration={daysUntilExpiration}
        className={className}
        isDeduplicated={isDeduplicated}
        isHumanTech={isHumanTech}
        isBeta={isBeta}
        onClick={() => {
          setCurrentPlatform(platform);
          onOpen();
        }}
      />
    );
  } else {
    stamp = (
      <DefaultStamp
        idx={i}
        platform={platform}
        platformProviders={platformProviderIds[platform.platform]}
        className={className}
        isHumanTech={isHumanTech}
        isBeta={isBeta}
        onClick={() => {
          setCurrentPlatform(platform);
          onOpen();
        }}
      />
    );
  }

  return stamp;
};
