// --- React Methods
import { useMemo, useState, useContext } from "react";

// --- Types
import { PLATFORM_ID, PROVIDER_ID, Stamp } from "@gitcoin/passport-types";

// --- Components
import { Button } from "./Button";
import { PlatformScoreSpec } from "../context/scorerContext";
import { CeramicContext } from "../context/ceramicContext";
import { useCustomization } from "../hooks/useCustomization";
import { isDynamicCustomization } from "../utils/customizationUtils";
import { getStampProviderIds } from "./CardList";
import { ProgressBar } from "./ProgressBar";
import { getDaysToExpiration } from "../utils/duration";

export type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

type PlatformCardProps = {
  i: number;
  platform: PlatformScoreSpec;
  selectedProviders: SelectedProviders;
  onOpen: () => void;
  setCurrentPlatform: React.Dispatch<React.SetStateAction<PlatformScoreSpec | undefined>>;
  className?: string;
};

type StampProps = {
  idx: number;
  platform: PlatformScoreSpec;
  daysUntilExpiration?: number;
  className?: string;
  onClick: () => void;
};

const DefaultStamp = ({ idx, platform, className, onClick }: StampProps) => {
  return (
    <div data-testid="platform-card" onClick={onClick} className={className} key={`${platform.name}${idx}`}>
      <div
        className="group relative flex h-full cursor-pointer flex-col rounded-lg border border-foreground-6 p-0 transition-all ease-out bg-gradient-to-b from-background to-background-2/70 
        hover:bg-opacity-100 hover:bg-gradient-to-b hover:from-transparent hover:shadow-even-md hover:border-background-3 hover:to-background-2 hover:shadow-background-3"
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
            <div className={`text-right`}>
              <h1 data-testid="available-points" className="text-2xl text-color-2">
                {Math.max(platform.possiblePoints - platform.earnedPoints, 0).toFixed(2)}
              </h1>
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

const VerifiedStamp = ({ idx, platform, daysUntilExpiration, className, onClick }: StampProps) => {
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
            <div className="bg-foreground-4 px-2 py-1 rounded text-right font-alt text-black">
              <p className="text-xs">Verified</p>
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
            <p className="flex-1 pleading-relaxed mt-2 hidden text-sm text-color-1 md:inline-block invisible">
              {platform.description}
            </p>
          </div>

          <div className="text-color-6">Points gained</div>
          <div className="text-2xl font-bold">{platform.earnedPoints.toFixed(2)}</div>
          <ProgressBar
            pointsGained={platform.earnedPoints}
            pointsAvailable={platform.possiblePoints - platform.earnedPoints}
            isSlim={true}
          />
        </div>
        <div className="flex items-center px-4 py-2 border-t border-foreground-4">
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
            {daysUntilExpiration} {daysUntilExpiration === 1 ? "day" : "days"} until stamps expire
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpiredStamp = ({ idx, platform, daysUntilExpiration, className, onClick }: StampProps) => {
  return <></>;
};

export const PlatformCard = ({
  i,
  platform,
  selectedProviders,
  onOpen,
  setCurrentPlatform,
  className,
}: PlatformCardProps): JSX.Element => {
  const platformIsExcluded = usePlatformIsExcluded(platform);
  const { passport } = useContext(CeramicContext);
  const platformProviders = selectedProviders[platform.platform];
  // initialized earliestExpirationDate with the expiration date of the first stamp (if any stamp is available)
  let earliestExpirationDate: Date = passport ? new Date(passport.stamps[0]?.credential.expirationDate) : new Date();
  let hasExpirationDate = false;
  let now = new Date();

  // Get the stamps for this platform
  // Also check for the earliest expiration date
  const platformStamps: Partial<Record<PROVIDER_ID, Stamp>> = !passport
    ? {}
    : platformProviders.reduce<Partial<Record<PROVIDER_ID, Stamp>>>((acc, provider) => {
        const stamp = passport?.stamps.find((stamps) => stamps.provider === provider);
        if (stamp) {
          const d = new Date(stamp.credential.expirationDate);
          if (!hasExpirationDate || d < earliestExpirationDate) {
            earliestExpirationDate = d;
            hasExpirationDate = true;
          }
        }
        acc[provider] = stamp;
        return acc;
      }, {});

  // Get the string refering to the eraliest expiration date
  const daysUntilExpiration = getDaysToExpiration({ expirationDate: earliestExpirationDate });
  let isExpired: boolean = now.getTime() - earliestExpirationDate.getTime() > 0;

  if (platformIsExcluded) return <></>;

  const verified = platform.earnedPoints > 0 || selectedProviders[platform.platform].length > 0;

  // returns a single Platform card
  let stamp = (
    // The not-verified & not-expired state of the card
    <DefaultStamp
      idx={i}
      platform={platform}
      className={className}
      onClick={() => {
        setCurrentPlatform(platform);
        onOpen();
      }}
    ></DefaultStamp>
  );
  if (verified) {
    stamp = (
      // The verified state of the card
      <VerifiedStamp
        idx={i}
        platform={platform}
        daysUntilExpiration={daysUntilExpiration}
        className={className}
        onClick={() => {
          setCurrentPlatform(platform);
          onOpen();
        }}
      ></VerifiedStamp>
    );
  }

  if (isExpired) {
    stamp = (
      // The expired state of the card
      <ExpiredStamp
        idx={i}
        platform={platform}
        daysUntilExpiration={daysUntilExpiration}
        className={className}
        onClick={() => {
          setCurrentPlatform(platform);
          onOpen();
        }}
      ></ExpiredStamp>
    );
  }
  return stamp;
};

const usePlatformIsExcluded = (platform: PlatformScoreSpec) => {
  const customization = useCustomization();

  const excludedByCustomization = useMemo(() => {
    const providers = getStampProviderIds(platform.platform);
    return (
      isDynamicCustomization(customization) &&
      customization.scorer?.weights &&
      !providers.some((provider) => parseFloat(customization.scorer?.weights?.[provider] || "") > 0)
    );
  }, [customization, platform.platform]);

  const excludedByFeatureFlag = useMemo(() => {
    // Feature Flag Guild Stamp
    if (process.env.NEXT_PUBLIC_FF_GUILD_STAMP !== "on" && platform.platform === "GuildXYZ") return true;

    // Feature Flag Idena Stamp
    if (process.env.NEXT_PUBLIC_FF_IDENA_STAMP !== "on" && platform.platform === "Idena") return true;

    // Feature Flag PHI Stamp
    if (process.env.NEXT_PUBLIC_FF_PHI_STAMP !== "on" && platform.platform === "PHI") return true;

    // Feature Flag Holonym Stamp
    if (process.env.NEXT_PUBLIC_FF_HOLONYM_STAMP !== "on" && platform.platform === "Holonym") return true;

    if (process.env.NEXT_PUBLIC_FF_TRUSTALABS_STAMPS !== "on" && platform.platform === "TrustaLabs") return true;

    if (process.env.NEXT_PUBLIC_FF_OUTDID_STAMP !== "on" && platform.platform === "Outdid") return true;

    return false;
  }, [platform.platform]);

  return excludedByCustomization || excludedByFeatureFlag;
};
