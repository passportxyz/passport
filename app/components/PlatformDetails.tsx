import React, { Fragment, useContext, useMemo, useState } from "react";
import { PlatformBanner, PlatformSpec } from "@gitcoin/passport-platforms";
import { GenericBanner } from "./GenericBanner";
import { JsonOutputModal } from "./JsonOutputModal";
import { CeramicContext } from "../context/ceramicContext";

import { ScorerContext } from "../context/scorerContext";
import { Popover, Transition } from "@headlessui/react";
import { RemoveStampModal } from "./RemoveStampModal";
import { ProgressBar } from "./ProgressBar";
import { getDaysToExpiration } from "../utils/duration";
import { PLATFORM_ID } from "@gitcoin/passport-types";

// --- Helpers
import { intersect } from "../utils/helpers";
import { usePlatforms } from "../hooks/usePlatforms";

const PlatformJsonButton = ({
  platformPassportData,
  platform,
  onClose,
}: {
  platformPassportData: any;
  platform: PlatformSpec;
  onClose: () => void;
}) => {
  const { handleDeleteStamps } = useContext(CeramicContext);
  const [stampDetailsModal, setStampDetailsModal] = useState(false);
  const [showRemoveStampModal, setShowRemoveStampModal] = useState(false);
  const { platformProviderIds } = usePlatforms();

  const providerIds = platformProviderIds[platform.platform];

  const onRemoveStamps = async () => {
    await handleDeleteStamps(providerIds);
    onClose();
  };

  return (
    <>
      <Popover className="relative">
        <>
          <Popover.Button className="ml-auto p-2">
            <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="2" cy="2" rx="2" ry="2" fill="white" />
              <ellipse cx="2" cy="8" rx="2" ry="2" fill="white" />
              <ellipse cx="2" cy="13.7998" rx="2" ry="2" fill="white" />
            </svg>
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute w-48 right-1 bg-background flex flex-col justify-start text-left p-4 rounded">
              <button onClick={() => setStampDetailsModal(true)} className="w-full text-left">
                Stamp Details
              </button>
              <button className="w-full text-left text-color-7" onClick={() => setShowRemoveStampModal(true)}>
                Remove Stamp
              </button>
            </Popover.Panel>
          </Transition>
        </>
      </Popover>
      <JsonOutputModal
        isOpen={stampDetailsModal}
        onClose={() => setStampDetailsModal(false)}
        title={"Platform JSON"}
        subheading={"You can find the Passport JSON data for this platform below"}
        jsonOutput={platformPassportData}
      />
      <RemoveStampModal
        isOpen={showRemoveStampModal}
        onClose={() => setShowRemoveStampModal(false)}
        title={`Remove ${platform.name} Stamp`}
        body={"This stamp will be removed from your Passport. You can still re-verify your stamp in the future."}
        stampsToBeDeleted={providerIds}
        handleDeleteStamps={onRemoveStamps}
      />
    </>
  );
};

const ExpirationIndicator = ({ expirationDate }: { expirationDate: Date | string }) => {
  const daysUntilExpiration = getDaysToExpiration({ expirationDate });

  const statusClass =
    daysUntilExpiration > 45 ? "text-color-8" : daysUntilExpiration > 10 ? "text-color-9" : "text-color-10";
  if (daysUntilExpiration < 0) {
    //     bg-gradient-to-b from-background to-background-5/30
    // hover:bg-opacity-100 hover:from-transparent hover:shadow-even-md hover:border-background-5 hover:to-background-5/60 hover:shadow-background-5"
    return (
      <div
        className="pl-4 flex items-center text-color-7 border-t-0 rounded-t-none rounded-b-lg py-2
        border border-background-5 bg-gradient-to-b from-background to-background-5/30"
      >
        Stamp expired
      </div>
    );
  } else {
    return (
      <div className="pl-4 flex items-center text-color-6 bg-gradient-to-b from-background via-background to-[#082F2A] border border-t-0 rounded-t-none rounded-b-lg border-foreground-5 py-2">
        <span className={`text-3xl pr-2 ${statusClass}`}>{daysUntilExpiration}</span>{" "}
        {daysUntilExpiration === 1 ? "day" : "days"} until Stamps expire
      </div>
    );
  }
};

export const customSideBarGradient = "bg-gradient-to-b from-background via-background to-[#082F2A]";

export const PlatformDetails = ({
  currentPlatform,
  bannerConfig,
  verifiedProviders,
  onClose,
}: {
  currentPlatform: PlatformSpec;
  bannerConfig?: PlatformBanner;
  verifiedProviders?: string[];
  onClose: () => void;
}) => {
  const { scoredPlatforms } = useContext(ScorerContext);
  const { passport, platformExpirationDates, expiredProviders } = useContext(CeramicContext);

  const currentPlatformScoreSpec = scoredPlatforms.find((platform) => platform.name === currentPlatform.name);

  const platformPassportData = useMemo(
    () =>
      verifiedProviders && passport && passport.stamps.filter((stamp) => verifiedProviders?.includes(stamp.provider)),
    [verifiedProviders, passport]
  );

  const hasStamps = platformPassportData && !!platformPassportData.length;

  const earnedPoints = currentPlatformScoreSpec?.earnedPoints || 0;
  const possiblePoints = currentPlatformScoreSpec?.displayPossiblePoints || 0;

  const pointsGained = +earnedPoints.toFixed(1);
  const pointsAvailable = +Math.max(possiblePoints - earnedPoints, 0).toFixed(1);

  verifiedProviders = verifiedProviders || [];
  const hasExpiredProviders = useMemo(() => {
    return intersect(new Set(expiredProviders), new Set(verifiedProviders)).size > 0;
  }, [verifiedProviders, expiredProviders]);

  const pointsBox = useMemo(() => {
    if (!hasStamps) {
      return null;
    }

    return hasExpiredProviders ? (
      <>
        <div className="mt-4 border-background-5 border rounded-t-lg px-4 py-2">
          <div className="flex justify-between">
            <p className="text-color-10">points gained</p>
            <p className="text-color-7">points left</p>
          </div>
          <div className="flex justify-between text-5xl">
            <p className="text-color-10">{pointsGained}</p>
            <p className="text-color-7">{pointsAvailable}</p>
          </div>
          <ProgressBar
            pointsGained={pointsGained}
            pointsAvailable={pointsAvailable}
            gainedBarColor="rgb(var(--color-text-7))"
            availableBarColor="rgb(var(--color-text-10))"
          />
        </div>
        <ExpirationIndicator expirationDate={platformExpirationDates[currentPlatform.platform as PLATFORM_ID] || ""} />
      </>
    ) : (
      <>
        <div className="mt-4 border-foreground-5 border rounded-t-lg px-4 py-2 bg-gradient-to-b from-background via-background to-[#082F2A]">
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
        <ExpirationIndicator expirationDate={platformExpirationDates[currentPlatform.platform as PLATFORM_ID] || ""} />
      </>
    );
  }, [
    hasStamps,
    hasExpiredProviders,
    pointsGained,
    pointsAvailable,
    platformExpirationDates,
    currentPlatform.platform,
  ]);

  return (
    <div className="w-full text-color-1">
      <div className="flex w-full items-center justify-between">
        <div className="flex">
          <img alt="Platform Image" className="h-10 w-10" src={currentPlatform?.icon} />
          <h2 className="ml-4 text-2xl">{currentPlatform?.name}</h2>
        </div>
        {!!verifiedProviders?.length && currentPlatformScoreSpec && (
          <PlatformJsonButton
            platform={currentPlatformScoreSpec}
            platformPassportData={platformPassportData}
            onClose={onClose}
          />
        )}
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
      {pointsBox}
    </div>
  );
};
