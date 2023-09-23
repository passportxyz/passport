// --- React Methods
import { useContext, useState } from "react";
import { useRouter } from "next/router";

// --- Types
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms";
import { UpdatedPlatforms } from "../config/providers";

// --- Context
import { CeramicContext } from "../context/ceramicContext";
import { OnChainContext } from "../context/onChainContext";

// --- Components
import { getStampProviderFilters } from "../config/filters";
import { FeatureFlags } from "../config/feature_flags";
import { OnchainTag } from "./OnchainTag";
import { Button } from "./Button";
import { PlatformScoreSpec } from "../context/scorerContext";

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

type PlatformCardProps = {
  i: number;
  platform: PlatformScoreSpec;
  selectedProviders: SelectedProviders;
  updatedPlatforms: UpdatedPlatforms | undefined;
  btnRef: React.MutableRefObject<undefined>;
  onOpen: () => void;
  setCurrentPlatform: React.Dispatch<React.SetStateAction<PlatformSpec | undefined>>;
  getUpdatedPlatforms: () => void;
  className?: string;
};

export const PlatformCard = ({
  i,
  platform,
  selectedProviders,
  updatedPlatforms,
  btnRef,
  onOpen,
  setCurrentPlatform,
  getUpdatedPlatforms,
  className,
}: PlatformCardProps): JSX.Element => {
  // import all providers
  const { allProvidersState } = useContext(CeramicContext);
  const { activeChainProviders } = useContext(OnChainContext);
  const [hovering, setHovering] = useState(false);

  // stamp filter
  const router = useRouter();
  const { filter } = router.query;

  // check if platform has onchain providers
  const hasOnchainProviders = () => {
    const providers = selectedProviders[platform.platform];
    if (!providers.length) return false;

    return providers.some((provider: PROVIDER_ID) => {
      const providerObj = activeChainProviders.find((p) => p.providerName === provider);
      if (providerObj) {
        return providerObj.credentialHash === allProvidersState[provider]?.stamp?.credential.credentialSubject.hash;
      }

      return false;
    });
  };

  // hide platforms based on filter
  const stampFilters = filter?.length && typeof filter === "string" ? getStampProviderFilters(filter) : false;
  const hidePlatform = stampFilters && !Object.keys(stampFilters).includes(platform.platform);
  if (hidePlatform) return <></>;

  // Feature Flag Guild Stamp
  if (process.env.NEXT_PUBLIC_FF_GUILD_STAMP !== "on" && platform.platform === "GuildXYZ") return <></>;

  // Feature Flag Hypercerts Stamp
  if (process.env.NEXT_PUBLIC_FF_HYPERCERT_STAMP !== "on" && platform.platform === "Hypercerts") return <></>;
  // Feature Flag Idena Stamp
  if (process.env.NEXT_PUBLIC_FF_IDENA_STAMP !== "on" && platform.platform === "Idena") return <></>;

  // Feature Flag PHI Stamp
  if (process.env.NEXT_PUBLIC_FF_PHI_STAMP !== "on" && platform.platform === "PHI") return <></>;

  // Feature Flag Holonym Stamp
  if (process.env.NEXT_PUBLIC_FF_HOLONYM_STAMP !== "on" && platform.platform === "Holonym") return <></>;

  if (process.env.NEXT_PUBLIC_FF_CYBERCONNECT_STAMPS !== "on" && platform.platform === "CyberConnect") return <></>;

  if (process.env.NEXT_PUBLIC_FF_TRUSTALABS_STAMPS !== "on" && platform.platform === "TrustaLabs") return <></>;

  const verified = platform.earnedPoints > 0;
  const platformClasses = verified
    ? "duration-800 relative flex h-full cursor-pointer flex-col rounded-lg border border-foreground-3 p-0 transition-all hover:border-foreground-4 hover:bg-opacity-100 hover:bg-gradient-to-b hover:shadow-background-3-10 override-text-color text-foreground-3 hover:text-color-2"
    : "duration-800 relative flex h-full cursor-pointer flex-col rounded-lg border border-foreground-6 bg-gradient-to-b from-background to-[#06153D] bg-size-200 bg-pos-0 p-0 transition-all hover:border-background-3 hover:bg-opacity-100 hover:bg-gradient-to-b hover:from-background-2 hover:to-background-3 hover:bg-pos-100 hover:shadow-background-3-25";

  const imgFilter = verified
    ? {
        filter: `invert(31%) sepia(13%) saturate(1992%) hue-rotate(100deg) brightness(67%) contrast(85%) grayscale(${
          hovering ? "70%" : "100%"
        })`,
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
      <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)} className={platformClasses}>
        {hovering && !verified && (
          <img
            src="./assets/card-background.svg"
            alt="Honey Comb background image for stamp"
            className="absolute bottom-0 right-0"
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
                {(platform.possiblePoints - platform.earnedPoints).toFixed(2)}
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
                className={`mr-0 text-lg md:mr-4 ${platform.name.split(" ").length > 1 ? "text-left" : "text-center"}`}
              >
                {platform.name}
              </h1>
            </div>
            <p className="pleading-relaxed mt-2 hidden text-base text-color-1 md:inline-block">
              {platform.description}
            </p>
          </div>
          <div>
            <Button
              data-testid="connect-button"
              variant="secondary"
              className={`mt-5 w-auto bg-transparent hover:bg-transparent ${
                verified && "hover:border-text-2 border-foreground-3"
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
