// --- React Methods
import { useState, useContext, useEffect } from "react";

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

export type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

type CardVariant = "default" | "partner";

type PlatformCardProps = {
  i: number;
  platform: PlatformScoreSpec;
  onOpen: () => void;
  variant?: CardVariant;
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
  variant?: CardVariant;
  isDeduplicated?: boolean;
};

const variantClasses: Record<CardVariant, string> = {
  default: "bg-background",
  partner:
    // TODO #3513 fix the partner stamps
    "bg-gradient-to-t from-background-2 to-background-3 border-background-3 shadow-[0px_0px_24px_0px] shadow-background-3",
};

const DefaultStamp = ({ idx, platform, className, onClick, variant }: StampProps) => {
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div
        className={`group relative flex h-full cursor-pointer flex-col rounded-2xl p-0 transition-all ease-out ${variantClasses[variant || "default"]}`}
      >
        <div className="m-6 flex h-full flex-col justify-between">
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
              className={`flex place-items-start flex-row ${
                platform.name.split(" ").length > 1 ? "items-center md:items-baseline" : "items-center"
              }`}
            >
              <h1
                data-testid="platform-name"
                className={`mr-0 text-xl md:mr-4 ${platform.name.split(" ").length > 1 ? "text-left" : "text-center"}`}
              >
                {platform.name}
              </h1>
            </div>
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
}: StampProps) => {
  const { activeChainProviders } = useOnChainData();
  const [isAnyOnchain, setIsAnyOnchain] = useState(false);

  useEffect(() => {
    const onchainProviderSet = new Set(activeChainProviders.map((p) => p.providerName));
    const providerSet = new Set(platformProviders);

    const intersection = onchainProviderSet.intersection(providerSet);
    setIsAnyOnchain(intersection.size > 0);
    // TODO: #3502: We have no separate representation for `MOVED_OUT_OF_DATE` state,also no representation if onchain expiration is different than db-expiration date
    // const isAllOnchain = intersection.size === providerSet.size;
  }, [activeChainProviders, platformProviders]);

  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div className="group relative flex h-full cursor-pointer flex-col rounded-2xl p-0 transition-all ease-out bg-emerald-100">
        <div className="m-6 flex h-full flex-col justify-between">
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
                <div className="px-2 py-1 text-l font-bold text-left text-emerald-600">
                  <p data-testid="verified-label">{isAnyOnchain ? "Minted" : "Verified"}</p>
                </div>
              )}
              {isDeduplicated && (
                <div className="px-2 py-1 text-l font-bold text-left text-emerald-600">
                  <p data-testid="verified-label">Deduplicated</p>
                </div>
              )}
            </div>
            <PassportPoints points={platform.earnedPoints} prefix="+" className="text-right" />
          </div>

          <div className="mt-4 h-full md:mt-6 inline-block justify-start text-color-4">
            <div
              className={`flex place-items-start flex-row ${
                platform.name.split(" ").length > 1 ? "items-center md:items-baseline" : "items-center"
              }`}
            >
              <h1
                data-testid="platform-name"
                className={`mr-0 text-xl md:mr-4 ${platform.name.split(" ").length > 1 ? "text-left" : "text-center"}`}
              >
                {platform.name}
              </h1>
            </div>
            <p className="flex-1 pleading-relaxed mt-2 text-sm inline-block visible text-gray-600">
              {platform.description}
            </p>
          </div>

          <div className="text-sm font-bold text-color-9 mb-2">
            <span className="text-xl text-color-4">{+platform.earnedPoints.toFixed(1)} </span> /{" "}
            {platform.displayPossiblePoints.toFixed(1)} points gained
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

const ExpiredStamp = ({ idx, platform, daysUntilExpiration, className, onClick, isDeduplicated }: StampProps) => {
  const [hovering, setHovering] = useState(false);
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="group relative flex h-full cursor-pointer flex-col rounded-2xl p-0 bg-[#e5e5e5]"
      >
        <div className="m-6 flex h-full flex-col justify-between">
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
              className={`flex place-items-start flex-row ${
                platform.name.split(" ").length > 1 ? "items-center md:items-baseline" : "items-center"
              }`}
            >
              <h1
                data-testid="platform-name"
                className={`mr-0 text-xl md:mr-4 ${platform.name.split(" ").length > 1 ? "text-left" : "text-center"}`}
              >
                {platform.name}
              </h1>
            </div>
            <p className="flex-1 pleading-relaxed mt-2 text-sm inline-block visible text-gray-600">
              {platform.description}
            </p>
          </div>
          <div className="text-sm font-bold text-color-9">
            <span className="text-xl text-color-4">{+platform.earnedPoints.toFixed(1)} </span> /{" "}
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
  variant,
}: PlatformCardProps): JSX.Element => {
  const { platformExpirationDates, expiredPlatforms, allProvidersState } = useContext(CeramicContext);
  const { platformSpecs, platformProviderIds } = usePlatforms();

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
        onClick={() => {
          setCurrentPlatform(platform);
          onOpen();
        }}
      />
    );
  } else {
    stamp = (
      <DefaultStamp
        variant={variant}
        idx={i}
        platform={platform}
        platformProviders={platformProviderIds[platform.platform]}
        className={className}
        onClick={() => {
          setCurrentPlatform(platform);
          onOpen();
        }}
      />
    );
  }

  return stamp;
};
