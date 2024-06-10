import React, { Fragment, Ref, useContext, useMemo, useState } from "react";
import { PlatformBanner, PlatformSpec } from "@gitcoin/passport-platforms";
import { GenericBanner } from "./GenericBanner";
import { JsonOutputModal } from "./JsonOutputModal";
import { CeramicContext } from "../context/ceramicContext";

import { ClockIcon, StarIcon } from "@heroicons/react/20/solid";
import { ScorerContext } from "../context/scorerContext";
import { Popover, Transition } from "@headlessui/react";
import { usePopper } from "react-popper";
import { RemoveStampModal } from "./RemoveStampModal";
import { useDisclosure } from "@chakra-ui/react";
import { STAMP_PROVIDERS } from "../config/providers";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

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
  const [removeStampModal, setRemoveStampModal] = useState(false);
  const [referenceElement, setReferenceElement] = useState(null);

  // const {
  //   isOpen: isOpenRemoveStampModal,
  //   onOpen: onOpenRemoveStampModal,
  //   onClose: onCloseRemoveStampModal,
  // } = useDisclosure();

  const providerIds =
    STAMP_PROVIDERS[platform.platform]?.reduce((all, stamp) => {
      return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
    }, [] as PROVIDER_ID[]) || [];

  const onRemoveStamps = async () => {
    await handleDeleteStamps(providerIds);
    onClose();
  };

  return (
    <>
      <Popover className="relative">
        <>
          <Popover.Button ref={setReferenceElement as unknown as Ref<HTMLButtonElement>} className="ml-auto">
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
              <button className="w-full text-left text-color-7" onClick={() => setRemoveStampModal(true)}>
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
        isOpen={removeStampModal}
        onClose={onClose}
        title={`Remove ${platform.name} Stamp`}
        body={"This stamp will be removed from your Passport. You can still re-verify your stamp in the future."}
        stampsToBeDeleted={providerIds}
        handleDeleteStamps={onRemoveStamps}
        platformId={platform.name as PLATFORM_ID}
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
          strokeWidth="5"
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
  onClose,
}: {
  currentPlatform: PlatformSpec;
  bannerConfig?: PlatformBanner;
  verifiedProviders?: string[];
  onClose: () => void;
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
