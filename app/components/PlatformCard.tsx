// --- React Methods
import { useState, useContext } from "react";

// --- Types
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

// --- Components
import { Button } from "./Button";
import { StampLabels } from "./StampLabels";
import { PlatformScoreSpec, ScorerContext } from "../context/scorerContext";
import { CeramicContext } from "../context/ceramicContext";
import { ProgressBar } from "./ProgressBar";
import { getDaysToExpiration } from "../utils/duration";
import { usePlatforms } from "../hooks/usePlatforms";
import { useStampDeduplication } from "../hooks/useStampDeduplication";

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
            <div className="text-right inline-block bg-white pb-0 pt-1 px-2 rounded-2xl">
              <div data-testid="available-points" className="text-l text-color-4">
                <div className="flex w-full items-start justify-end">
                  <svg width="17" height="21" viewBox="0 0 17 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.87649 6.81955L8.21152 3.65245V3.65134C8.38995 3.54534 8.60984 3.54534 8.78828 3.65134L14.1233 6.81844C14.3017 6.92444 14.4117 7.12014 14.4117 7.33215V13.666C14.4117 13.878 14.3017 14.0737 14.1233 14.1797L8.78828 17.3468C8.60984 17.4528 8.38995 17.4528 8.21152 17.3468L5.47191 15.7204C5.29347 15.6144 5.18353 15.4187 5.18353 15.2067V8.87289C5.18353 8.66088 5.29347 8.46518 5.47191 8.35918L8.21152 6.73282C8.38995 6.62682 8.60984 6.62682 8.78828 6.73282L11.5279 8.35918C11.7063 8.46518 11.8163 8.66088 11.8163 8.87289V12.1256C11.8163 12.3376 11.7063 12.5333 11.5279 12.6393L8.78323 14.2686C8.60552 14.3743 8.38671 14.3746 8.20864 14.2701L8.06949 14.1886C7.88997 14.0829 7.77895 13.8865 7.77895 13.6738V10.3395C7.77895 10.1809 7.8615 10.0337 7.99523 9.95441L8.35571 9.74055C8.44511 9.68755 8.55469 9.68755 8.64409 9.74055L8.93247 9.91179C9.1109 10.0178 9.22085 10.2135 9.22085 10.4255V12.0415C9.22085 12.1556 9.34089 12.2268 9.43713 12.1697L10.086 11.7846C10.2644 11.6786 10.3744 11.4829 10.3744 11.2709V9.73017C10.3744 9.51817 10.2644 9.32247 10.086 9.21647L8.78828 8.44628C8.60984 8.34028 8.38995 8.34028 8.21152 8.44628L6.91381 9.21647C6.73537 9.32247 6.62543 9.51817 6.62543 9.73017V14.3524C6.62543 14.5644 6.73537 14.7601 6.91381 14.8661L8.21152 15.6363C8.38995 15.7423 8.60984 15.7423 8.78828 15.6363L12.6814 13.3254C12.8598 13.2194 12.9698 13.0237 12.9698 12.8117V8.18943C12.9698 7.97743 12.8598 7.78173 12.6814 7.67572L8.78828 5.3648C8.60984 5.25879 8.38995 5.25879 8.21152 5.3648L4.31839 7.67572C4.13995 7.78173 4.03001 7.97743 4.03001 8.18943V14.6089C4.03001 14.723 3.90997 14.7942 3.81372 14.7371L3.16487 14.352C2.808 14.1404 2.58811 13.7486 2.58811 13.325V7.33325C2.58811 7.12125 2.69805 6.92555 2.87649 6.81955Z"
                      fill="#006B56"
                    />
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M0.288381 15.7171L8.21162 20.4205C8.39006 20.5265 8.60995 20.5265 8.78838 20.4205L16.7116 15.7171C16.8901 15.6111 17 15.4154 17 15.2034V5.7966C17 5.5846 16.8901 5.3889 16.7116 5.2829L8.78838 0.579502C8.60995 0.473499 8.39006 0.473499 8.21162 0.579502L0.288381 5.2829C0.109946 5.3889 0 5.5846 0 5.7966V15.2034C0 15.4154 0.109946 15.6111 0.288381 15.7171ZM8.21162 18.7089L1.73028 14.8613C1.55185 14.7553 1.4419 14.5596 1.4419 14.3476V6.65278C1.4419 6.44077 1.55185 6.24507 1.73028 6.13907L8.21162 2.29148C8.39006 2.18548 8.60995 2.18548 8.78838 2.29148L15.2697 6.13907C15.4482 6.24507 15.5581 6.44077 15.5581 6.65278V14.3476C15.5581 14.5596 15.4482 14.7553 15.2697 14.8613L8.78838 18.7089C8.60995 18.8149 8.39006 18.8149 8.21162 18.7089Z"
                      fill="#006B56"
                    />
                  </svg>
                  <div className="pl-1">
                    {+Math.max(platform.displayPossiblePoints - platform.earnedPoints, 0).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center h-full md:mt-6 md:inline-block md:justify-start text-color-4">
            <div
              className={`flex flex-col place-items-start md:flex-row ${
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
            <p className="flex-1 pleading-relaxed mt-2 hidden text-sm md:inline-block visible text-gray-600">
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

const VerifiedStamp = ({ idx, platform, daysUntilExpiration, className, onClick, isDeduplicated }: StampProps) => {
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div className="group relative flex h-full cursor-pointer flex-col rounded-2xl p-0 transition-all ease-out bg-emerald-100">
        <div className="m-6 flex h-full flex-col justify-between">
          <div className="flex w-full items-center">
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
            <div className="px-2 py-1 text-l font-bold text-left text-emerald-600">
              <p data-testid="verified-label">Verified</p>
            </div>
          </div>

          <div className="mt-4 flex justify-center h-full md:mt-6 md:inline-block md:justify-start">
            <div
              className={`flex flex-col place-items-start text-color-4 md:flex-row ${
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
            <p className="flex-1 pleading-relaxed mt-2 hidden text-sm text-color-4 md:inline-block invisible">
              {platform.description}
            </p>
          </div>

          <div className="text-sm font-bold text-color-9">
            <span className="text-xl text-color-4">{+platform.earnedPoints.toFixed(1)} </span> /{" "}
            {platform.displayPossiblePoints.toFixed(1)} points gained
          </div>
          <ProgressBar
            pointsGained={platform.earnedPoints}
            pointsAvailable={Math.max(platform.displayPossiblePoints - platform.earnedPoints, 0)}
            isSlim={true}
          />
          <div className="flex flex-row justify-center px-4 pt-2">
            <div>
              <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.5 12.332C3.5 14.1121 4.02784 15.8521 5.01677 17.3322C6.00571 18.8122 7.41131 19.9658 9.05585 20.6469C10.7004 21.3281 12.51 21.5064 14.2558 21.1591C16.0016 20.8118 17.6053 19.9547 18.864 18.696C20.1226 17.4373 20.9798 15.8337 21.3271 14.0878C21.6743 12.342 21.4961 10.5324 20.8149 8.88788C20.1337 7.24335 18.9802 5.83774 17.5001 4.8488C16.0201 3.85987 14.28 3.33203 12.5 3.33203C9.98395 3.3415 7.56897 4.32325 5.76 6.07203L3.5 8.33203M3.5 8.33203V3.33203M3.5 8.33203H8.5M12.5 7.33203V12.332L16.5 14.332"
                  stroke="black"
                  stroke-opacity="0.5"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
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
            <div className="flex items-center bg-background py-1 px-2 rounded-md">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2.5 10C2.5 11.4834 2.93987 12.9334 3.76398 14.1668C4.58809 15.4001 5.75943 16.3614 7.12987 16.9291C8.50032 17.4968 10.0083 17.6453 11.4632 17.3559C12.918 17.0665 14.2544 16.3522 15.3033 15.3033C16.3522 14.2544 17.0665 12.918 17.3559 11.4632C17.6453 10.0083 17.4968 8.50032 16.9291 7.12987C16.3614 5.75943 15.4001 4.58809 14.1668 3.76398C12.9334 2.93987 11.4834 2.5 10 2.5C7.90329 2.50789 5.89081 3.32602 4.38333 4.78333L2.5 6.66667M2.5 6.66667V2.5M2.5 6.66667H6.66667M10 5.83333V10L13.3333 11.6667"
                  stroke="black"
                  stroke-opacity="0.5"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span className="text-emerald-900 pl-1">Expired</span>
            </div>
          </div>
          <div className="mt-4 flex justify-center h-full md:mt-6 md:inline-block md:justify-start">
            <div
              className={`flex flex-col place-items-start text-color-4 md:flex-row ${
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
            <p className="flex-1 pleading-relaxed mt-2 hidden text-sm text-color-4 md:inline-block invisible">
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
