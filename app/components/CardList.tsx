// --- React Methods
import React, { useCallback, useContext, useMemo, useState } from "react";

import { usePlatforms } from "../hooks/usePlatforms";

// --- Chakra UI Elements
import { useDisclosure } from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import PageWidthGrid from "../components/PageWidthGrid";
import { PlatformScoreSpec, ScorerContext } from "../context/scorerContext";
import { Category } from "./Category";
import { CeramicContext } from "../context/ceramicContext";
import { GenericPlatform } from "./GenericPlatform";
import { useCustomization } from "../hooks/useCustomization";

export type CardListProps = {
  isLoading?: boolean;
  className?: string;
  initialOpen?: boolean;
};

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

const useShouldDisplayPlatform = () => {
  const customization = useCustomization();
  const { platformProviderIds, platforms } = usePlatforms();

  const shouldDisplayPlatform = useCallback(
    (platform: PlatformScoreSpec): boolean => {
      const providers = platformProviderIds[platform.platform];

      if (platform.possiblePoints <= 0) {
        return false;
      }

      const platformGroupSpec = platforms.get(platform.platform)?.platFormGroupSpec;

      const allProvidersDeprecated = platformGroupSpec?.every((group) =>
        group.providers.every((provider) => provider.isDeprecated)
      );

      // Hide if all providers are deprecated for this platform and no points were earned
      if (platform.earnedPoints <= 0 && allProvidersDeprecated) {
        return false;
      }

      // Hide allow list if no points were earned when onboarding
      if (platform.platform.startsWith("AllowList") && platform.earnedPoints === 0) {
        return false;
      }

      if (
        customization.scorer?.weights &&
        !providers.some((provider) => parseFloat(customization.scorer?.weights?.[provider] || "") > 0)
      ) {
        return false;
      }

      // Feature Flag Guild Stamp
      if (process.env.NEXT_PUBLIC_FF_GUILD_STAMP !== "on" && platform.platform === "GuildXYZ") return false;

      // Feature Flag Idena Stamp
      if (process.env.NEXT_PUBLIC_FF_IDENA_STAMP !== "on" && platform.platform === "Idena") return false;

      // Feature Flag PHI Stamp
      if (process.env.NEXT_PUBLIC_FF_PHI_STAMP !== "on" && platform.platform === "PHI") return false;

      // Feature Flag Holonym Stamp
      if (process.env.NEXT_PUBLIC_FF_HOLONYM_STAMP !== "on" && platform.platform === "Holonym") return false;

      if (process.env.NEXT_PUBLIC_FF_TRUSTALABS_STAMPS !== "on" && platform.platform === "TrustaLabs") return false;

      if (process.env.NEXT_PUBLIC_FF_OUTDID_STAMP !== "on" && platform.platform === "Outdid") return false;

      return true;
    },
    [customization, platformProviderIds]
  );

  return { shouldDisplayPlatform };
};

export const CardList = ({ className, isLoading = false, initialOpen = true }: CardListProps): JSX.Element => {
  const { allProvidersState } = useContext(CeramicContext);
  const { scoredPlatforms } = useContext(ScorerContext);
  const { platformProviderIds, platforms, platformCatagories } = usePlatforms();
  const { isOpen, onClose } = useDisclosure();
  const [currentPlatform, setCurrentPlatform] = useState<PlatformScoreSpec | undefined>();
  const { shouldDisplayPlatform } = useShouldDisplayPlatform();

  const selectedProviders: SelectedProviders = useMemo(
    () =>
      Array.from(platforms.keys()).reduce((providers, platformId) => {
        providers[platformId] = (platformProviderIds[platformId] || []).filter(
          (providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined"
        );
        return providers;
      }, {} as SelectedProviders),
    [platforms, allProvidersState, platformProviderIds]
  );

  const [verified, unverified] = scoredPlatforms.reduce(
    ([verified, unverified], platform): [PlatformScoreSpec[], PlatformScoreSpec[]] => {
      return platform.earnedPoints === 0 && (selectedProviders[platform.platform] || []).length === 0
        ? [verified, [...unverified, platform]]
        : [[...verified, platform], unverified];
    },
    [[], []] as [PlatformScoreSpec[], PlatformScoreSpec[]]
  );

  const sortedPlatforms = [
    ...unverified.sort((a, b) => b.possiblePoints - a.possiblePoints),
    ...verified.sort((a, b) => b.possiblePoints - b.earnedPoints - (a.possiblePoints - a.earnedPoints)),
  ];

  const groupedPlatforms: {
    [key: string]: {
      name: string;
      id?: string;
      description: string;
      sortedPlatforms: PlatformScoreSpec[];
    };
  } = {};

  // Generate grouped stamps
  platformCatagories.forEach((category) => {
    groupedPlatforms[category.name] = {
      name: category.name,
      id: category.id,
      description: category.description,
      sortedPlatforms: [],
    };
  });

  sortedPlatforms.filter(shouldDisplayPlatform).forEach((stamp) => {
    platformCatagories.forEach((category) => {
      if (category.platforms.includes(stamp.platform)) {
        groupedPlatforms[category.name].sortedPlatforms.push(stamp);
      }
    });
  });

  const platformProps = currentPlatform?.platform && platforms.get(currentPlatform.platform);

  return (
    <>
      <PageWidthGrid className={className}>
        {Object.keys(groupedPlatforms).map((category) => {
          if (!groupedPlatforms[category].sortedPlatforms.length) return null;
          return (
            <Category
              className={className}
              category={groupedPlatforms[category]}
              key={category}
              isLoading={isLoading}
            />
          );
        })}
      </PageWidthGrid>
      {platformProps && currentPlatform && (
        <GenericPlatform
          platform={platformProps.platform}
          platformScoreSpec={currentPlatform}
          platFormGroupSpec={platformProps.platFormGroupSpec}
          isOpen={isOpen}
          onClose={() => {
            setCurrentPlatform(undefined);
            onClose();
          }}
        />
      )}
    </>
  );
};
