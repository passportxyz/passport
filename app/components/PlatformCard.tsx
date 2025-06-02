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
  default: "bg-gradient-to-b from-background to-background-2/70 border-foreground-6",
  partner:
    "bg-gradient-to-t from-background-2 to-background-3 border-background-3 shadow-[0px_0px_24px_0px] shadow-background-3",
};

const DefaultStamp = ({ idx, platform, className, onClick, variant }: StampProps) => {
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div
        className={`group relative flex h-full cursor-pointer flex-col rounded-lg border p-0 transition-all ease-out 
        hover:bg-opacity-100 hover:bg-gradient-to-b hover:from-transparent hover:shadow-even-md hover:border-background-3 hover:to-background-2 hover:shadow-background-3
        ${variantClasses[variant || "default"]}`}
      >
        <img
          src="./assets/card-background.svg"
          alt=""
          className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100"
        />
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
            <div className="text-right inline-block">
              <div data-testid="available-points" className="text-l text-color-2">
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
                  <div className="pl-2">
                    {+Math.max(platform.displayPossiblePoints - platform.earnedPoints, 0).toFixed(1)}
                  </div>
                </div>
              </div>
              <p className="text-xs">Available Points</p>
            </div>
          </div>

          <div className="mt-4 flex justify-center h-full md:mt-6 md:inline-block md:justify-start">
            <div
              className={`flex flex-col place-items-start text-color-2 md:flex-row ${
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
            <p className="flex-1 pleading-relaxed mt-2 hidden text-sm text-color-1 md:inline-block visible">
              {platform.description}
            </p>
          </div>
          <Button
            data-testid="connect-button"
            variant="custom"
            className="mt-5 w-auto border bg-transparent text-foreground-2 border-foreground-2 z-10"
          >
            Connect
          </Button>
        </div>
      </div>
    </div>
  );
};

const VerifiedStamp = ({ idx, platform, daysUntilExpiration, className, onClick, isDeduplicated }: StampProps) => {
  const [hovering, setHovering] = useState(false);
  const imgFilter = {
    filter: `invert(27%) sepia(97%) saturate(295%) hue-rotate(113deg) brightness(${
      hovering ? "100%" : "56%"
    }) contrast(89%)`,
  };
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="group relative flex h-full cursor-pointer flex-col rounded-lg border p-0 transition-all ease-out
        hover:bg-opacity-100 hover:bg-gradient-to-b hover:from-transparent hover:shadow-even-md
        border-foreground-5 hover:border-foreground-4 hover:to-foreground-5/70 hover:shadow-foreground-4
        bg-gradient-to-b from-background to-foreground-5/40"
      >
        <div className="m-6 flex h-full flex-col justify-between">
          <div className="flex w-full items-center justify-between">
            {platform.icon ? (
              <div style={imgFilter}>
                <img src={platform.icon} alt={platform.name} className="h-10 w-10 grayscale" />
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
            <StampLabels primaryLabel="Verified" primaryBgColor="bg-foreground-4" isDeduplicated={isDeduplicated} />
          </div>

          <div className="mt-4 flex justify-center h-full md:mt-6 md:inline-block md:justify-start">
            <div
              className={`flex flex-col place-items-start text-color-2 md:flex-row ${
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
            <p className="flex-1 pleading-relaxed mt-2 hidden text-sm text-color-1 md:inline-block invisible">
              {platform.description}
            </p>
          </div>

          <div className="text-color-6">Points gained</div>
          <div className="text-2xl font-bold">{+platform.earnedPoints.toFixed(1)}</div>
          <ProgressBar
            pointsGained={platform.earnedPoints}
            pointsAvailable={Math.max(platform.displayPossiblePoints - platform.earnedPoints, 0)}
            isSlim={true}
          />
        </div>
        <div className="flex items-center mt-5 px-4 py-2 border-t border-foreground-4">
          <div className="flex-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 6C12 6.78793 11.8448 7.56815 11.5433 8.2961C11.2417 9.02405 10.7998 9.68549 10.2426 10.2426C9.68549 10.7998 9.02405 11.2417 8.2961 11.5433C7.56815 11.8448 6.78793 12 6 12L6 6H12Z"
                fill="#C1F6FF"
              />
              <circle cx="6" cy="6" r="5.5" stroke="#C1F6FF" />
            </svg>
          </div>
          <div className="flex-1 pl-2 text-foreground-2 override-text-color">
            {daysUntilExpiration} {daysUntilExpiration === 1 ? "day" : "days"} until Stamps expire
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpiredStamp = ({ idx, platform, daysUntilExpiration, className, onClick, isDeduplicated }: StampProps) => {
  const [hovering, setHovering] = useState(false);
  const imgFilter = {
    filter: `invert(27%) sepia(97%) saturate(295%) hue-rotate(113deg) brightness(${
      hovering ? "100%" : "56%"
    }) contrast(89%)`,
  };
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="group relative flex h-full cursor-pointer flex-col rounded-lg border border-background-5 p-0 transition-all ease-out
        bg-gradient-to-b from-background to-background-5/30
        hover:bg-opacity-100 hover:from-transparent hover:shadow-even-md hover:border-background-5 hover:to-background-5/60 hover:shadow-background-5"
      >
        <div className="m-6 flex h-full flex-col justify-between">
          <div className="flex w-full items-center justify-between">
            {platform.icon ? (
              <div style={imgFilter}>
                <img src={platform.icon} alt={platform.name} className="h-10 w-10 grayscale" />
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
            <StampLabels primaryLabel="Expired" primaryBgColor="bg-background-5" isDeduplicated={isDeduplicated} />
          </div>

          <div className="mt-4 flex justify-center h-full md:mt-6 md:inline-block md:justify-start">
            <div
              className={`flex flex-col place-items-start text-color-2 md:flex-row ${
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
            <p className="flex-1 pleading-relaxed mt-2 hidden text-sm text-color-1 md:inline-block invisible">
              {platform.description}
            </p>
          </div>

          <div className="text-color-6">Points gained</div>
          <div className="text-2xl font-bold">{+platform.earnedPoints.toFixed(1)}</div>
          <ProgressBar
            pointsGained={platform.earnedPoints}
            pointsAvailable={Math.max(platform.displayPossiblePoints - platform.earnedPoints, 0)}
            isSlim={true}
          />
        </div>
        <Button
          data-testid="update-button"
          variant="custom"
          className="mb-5 mx-5 w-auto border bg-transparent border-background-5 text-color-7 z-10"
        >
          Update
        </Button>
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
