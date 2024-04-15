// --- React Methods
import { useMemo, useState } from "react";

// --- Types
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";

// --- Components
import { Button } from "./Button";
import { PlatformScoreSpec } from "../context/scorerContext";
import { useCustomization } from "../hooks/useCustomization";
import { isDynamicCustomization } from "../utils/customizationUtils";
import { getStampProviderIds } from "./CardList";

export type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

type PlatformCardProps = {
  i: number;
  platform: PlatformScoreSpec;
  selectedProviders: SelectedProviders;
  onOpen: () => void;
  setCurrentPlatform: React.Dispatch<React.SetStateAction<PlatformScoreSpec | undefined>>;
  className?: string;
};

export const PlatformCard = ({
  i,
  platform,
  selectedProviders,
  onOpen,
  setCurrentPlatform,
  className,
}: PlatformCardProps): JSX.Element => {
  const [hovering, setHovering] = useState(false);
  const platformIsExcluded = usePlatformIsExcluded(platform);

  if (platformIsExcluded) return <></>;

  const verified = platform.earnedPoints > 0 || selectedProviders[platform.platform].length > 0;

  const platformClasses = verified
    ? "border-foreground-5 hover:border-foreground-4 hover:to-foreground-5/50 hover:shadow-foreground-4 hover:text-color-2 text-foreground-5 override-text-color"
    : "border-foreground-6 hover:border-background-3 hover:to-background-2 hover:shadow-background-3";

  const imgFilter = verified
    ? {
        filter: `invert(27%) sepia(97%) saturate(295%) hue-rotate(113deg) brightness(${
          hovering ? "100%" : "56%"
        }) contrast(89%)`,
      }
    : {};

  // returns a single Platform card
  return (
    <div
      onClick={() => {
        setCurrentPlatform(platform);
        onOpen();
      }}
      className={className}
      key={`${platform.name}${i}`}
    >
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`group relative flex h-full cursor-pointer flex-col rounded-lg border p-0 transition-all ease-out hover:bg-opacity-100 hover:bg-gradient-to-b hover:from-transparent hover:shadow-even-md ${platformClasses}`}
      >
        {!verified && (
          <img
            src="./assets/card-background.svg"
            alt=""
            className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100"
          />
        )}
        <div className="m-6 flex h-full flex-col justify-between">
          <div className="flex w-full items-center justify-between">
            {platform.icon ? (
              <div style={imgFilter}>
                <img src={platform.icon} alt={platform.name} className={`h-10 w-10 ${verified && "grayscale"}`} />
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

          <div className="mt-4 flex justify-center md:mt-6 md:inline-block md:justify-start">
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
            <p
              className={`pleading-relaxed mt-2 hidden text-base text-color-1 md:inline-block ${
                verified ? "invisible" : "visible"
              } `}
            >
              {platform.description}
            </p>
          </div>
          <div>
            <Button
              data-testid="connect-button"
              variant="custom"
              className={`mt-5 w-auto border bg-transparent text-foreground-2 ${
                verified ? "border-foreground-5 group-hover:border-foreground-4" : "border-foreground-2"
              }`}
            >
              {verified ? "Verified" : "Connect"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
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
  }, [customization.key, platform.platform]);

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

    return false;
  }, [platform.platform]);

  return excludedByCustomization || excludedByFeatureFlag;
};
