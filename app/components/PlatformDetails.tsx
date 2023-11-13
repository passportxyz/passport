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

const isoToDateString = (isoDate: string) => {
  const date = new Date(isoDate);
  return `${date.getMonth() + 1}.${date.getDate()}.${date.getFullYear()}`;
};

const ProgressBar = ({ pointsGained, pointsAvailable }: { pointsGained: number; pointsAvailable: number }) => {
  const percentGained = (pointsGained / (pointsGained + pointsAvailable)) * 100 || 0;

  // Offset for the beginning of the progress bar
  const startOffset = 2;
  const progressBarOffset = percentGained + startOffset;

  return (
    <svg viewBox="0 8 104 4">
      {/* Rounded left edge */}
      <path d="M2,10 L2,10" strokeLinecap="round" strokeWidth={4} stroke="rgb(var(--color-foreground-2))" />

      {/* Rounded right edge */}
      <path d="M102,10 L102,10" strokeLinecap="round" strokeWidth={4} stroke="rgb(var(--color-foreground-4))" />

      {/* Background w/ "available" color */}
      <path d="M2,10 L102,10" strokeLinecap="butt" strokeWidth={4} stroke="rgb(var(--color-foreground-4))" />

      {/* Black progress bar, sticks out a little further than the main progress bar to show a black line */}
      <path
        d={`M2,10 L102,10`}
        strokeLinecap="butt"
        strokeWidth={4}
        stroke="rgb(var(--color-background))"
        strokeDasharray="102"
        strokeDashoffset={104 - progressBarOffset - 0.75}
        className="transition-[stroke-dashoffset] delay-100 duration-1000 ease-in-out"
      />

      {/* Main progress bar */}
      <path
        d={`M2,10 L102,10`}
        strokeLinecap={percentGained < 100 ? "butt" : "round"}
        strokeWidth={4}
        stroke="rgb(var(--color-foreground-2))"
        strokeDasharray="102"
        strokeDashoffset={104 - progressBarOffset}
        className="transition-[stroke-dashoffset] delay-100 duration-1000 ease-in-out"
      />
    </svg>
  );
};

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

  const earnedDate = hasStamps ? isoToDateString(platformPassportData[0].credential.issuanceDate) : "mm.dd.yyyy";
  const expiresDate = hasStamps ? isoToDateString(platformPassportData[0].credential.expirationDate) : "mm.dd.yyyy";

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
      {currentPlatform?.website ? (
        <a
          className="mt-8 inline-block text-base hover:underline md:w-8/12"
          href={currentPlatform?.website}
          target="_blank"
          rel="noreferrer"
        >
          {currentPlatform?.description}
        </a>
      ) : (
        <p className="mt-8 text-base md:w-8/12">{currentPlatform?.description}</p>
      )}
      {bannerConfig && <GenericBanner banner={bannerConfig} />}
      <hr className="mt-4 border-foreground-3" />
      <div className="my-4 grid grid-cols-[1fr_2px_1fr] gap-y-4 text-center">
        <div className={`flex flex-col items-center ${hasStamps ? "text-color-2" : "text-color-5"}`}>
          <StarIcon width="40" />
          <span className="font-bold">Earned</span>
          <span className="">{earnedDate}</span>
        </div>
        <div className={`col-start-3 flex flex-col items-center ${hasStamps ? "text-color-2" : "text-color-5"}`}>
          <ClockIcon width="40" />
          <span className="font-bold">Expires</span>
          <span className="">{expiresDate}</span>
        </div>
        <hr className="col-span-full border-foreground-3" />
        <div className="flex flex-col items-center text-foreground-2">
          <span className="text-4xl">{pointsGained}</span>
          <span className="">Points Gained</span>
        </div>
        <div className="border-r border-foreground-3" />
        <div className="flex flex-col items-center text-color-2">
          <span className="text-4xl">{pointsAvailable}</span>
          <span className="">Available Points</span>
        </div>
      </div>
      <ProgressBar pointsGained={pointsGained} pointsAvailable={pointsAvailable} />
    </div>
  );
};
