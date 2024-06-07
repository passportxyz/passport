import React, { useContext, useMemo, useState } from "react";
import { PlatformBanner, PlatformSpec } from "@gitcoin/passport-platforms";
import { GenericBanner } from "./GenericBanner";
import { JsonOutputModal } from "./JsonOutputModal";
import { CeramicContext } from "../context/ceramicContext";

import { ClockIcon, StarIcon } from "@heroicons/react/20/solid";
import { ScorerContext } from "../context/scorerContext";

const PlatformJsonButton = ({ platformPassportData }: { platformPassportData: any }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        data-testid="button-passport-json-mobile"
        className="ml-auto h-8 w-8 rounded-md border border-foreground-4 bg-background text-xs text-color-2"
        onClick={() => setIsOpen(true)}
        title="View Stamp JSON"
      >
        {`</>`}
      </button>
      <JsonOutputModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={"Platform JSON"}
        subheading={"You can find the Passport JSON data for this platform below"}
        jsonOutput={platformPassportData}
      />
    </>
  );
};

const ProgressBar = ({ pointsGained, pointsAvailable }: { pointsGained: number; pointsAvailable: number }) => {
  const percentGained = (pointsGained / (pointsGained + pointsAvailable)) * 100 || 0;

  const pageWidth = window.innerWidth;

  const padding = 80; // 40 px on either side
  const sliderWidth = 332;
  let fullSliderWidth = 332;

  if (pageWidth < sliderWidth + padding) {
    fullSliderWidth = pageWidth - padding;
  }

  const indicatorWidth = fullSliderWidth * (percentGained / 100);

  return (
    <div className="relative h-6">
      <svg className="absolute top-1.5 z-0" viewBox="0 8 104 4">
        <path d="M102,10 L102,10" strokeLinecap="round" strokeWidth={2} stroke="rgb(var(--color-foreground-4))" />
        <path d="M2,10 L102,10" strokeLinecap="butt" strokeWidth={2} stroke="rgb(var(--color-foreground-4))" />
        <path d="M2,10 L2,10" strokeLinecap="round" strokeWidth={2} stroke="rgb(var(--color-foreground-4))" />
      </svg>
      <svg
        className="absolute"
        id="mySvg"
        width="366"
        height="26"
        viewBox="0 0 366 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2.5"
          y="2.5"
          width={indicatorWidth}
          height="21"
          rx="10.5"
          fill="#C1F6FF"
          stroke="#0E2825"
          stroke-width="5"
          className="transition-[stroke-dashoffset] delay-100 duration-1000 ease-in-out"
        />
      </svg>
    </div>
  );
};

const ExpirationIndicator = ({ expirationDate }: { expirationDate: string }) => {
  const now = new Date().getTime();
  const expirationMillis = new Date(expirationDate).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  const daysUntilExpiration = (expirationMillis - now) / oneDay;
  const status = daysUntilExpiration > 45 ? "#A0FE7F" : daysUntilExpiration > 10 ? "#FEF17F" : "#FEA57F";

  return (
    <div className="pl-4 flex items-center text-color-6 bg-gradient-to-b from-background via-background to-[#082F2A] border border-t-0 rounded-t-none rounded-b-lg border-foreground-5 py-2">
      <span className={`text-3xl pr-2 text-[${status}]`}>{daysUntilExpiration.toFixed(0)}</span> days until stamps
      expire
    </div>
  );
};

export const customSideBarGradient = "bg-gradient-to-b from-background via-background to-[#082F2A]";

export const PlatformDetails = ({
  currentPlatform,
  bannerConfig,
  verifiedProviders,
}: {
  currentPlatform: PlatformSpec;
  bannerConfig?: PlatformBanner;
  verifiedProviders?: string[];
}) => {
  const { scoredPlatforms } = useContext(ScorerContext);
  const { passport } = useContext(CeramicContext);

  const currentPlatformScoreSpec = scoredPlatforms.find((platform) => platform.name === currentPlatform.name);

  const platformPassportData = useMemo(
    () =>
      verifiedProviders && passport && passport.stamps.filter((stamp) => verifiedProviders.includes(stamp.provider)),
    [verifiedProviders, passport]
  );

  const hasStamps = platformPassportData && !!platformPassportData.length;

  const earnedPoints = currentPlatformScoreSpec?.earnedPoints || 0;
  const possiblePoints = currentPlatformScoreSpec?.possiblePoints || 0;

  const pointsGained = +earnedPoints.toFixed(2);
  const pointsAvailable = +Math.max(possiblePoints - earnedPoints, 0).toFixed(2);

  return (
    <div className="w-full text-color-1">
      <div className="flex w-full items-center">
        <img alt="Platform Image" className="h-10 w-10" src={currentPlatform?.icon} />
        <h2 className="ml-4 text-2xl">{currentPlatform?.name}</h2>
        {!!verifiedProviders?.length && <PlatformJsonButton platformPassportData={platformPassportData} />}
      </div>
      {bannerConfig && <GenericBanner banner={bannerConfig} />}
      {hasStamps && (
        <>
          <div className={`mt-4 border-foreground-5 border rounded-t-lg px-4 py-2 ${customSideBarGradient}`}>
            <div className="flex justify-between">
              <p className="text-color-6">points gained</p>
              <p className="text-color-2">points left</p>
            </div>
            <div className="flex justify-between text-5xl">
              <p className="text-color-6">{pointsGained}</p>
              <p className="text-color-2">{pointsAvailable}</p>
            </div>
            <ProgressBar pointsGained={pointsGained} pointsAvailable={pointsAvailable} />
          </div>
          <ExpirationIndicator expirationDate={platformPassportData[0].credential.expirationDate} />
        </>
      )}
    </div>
  );
};
