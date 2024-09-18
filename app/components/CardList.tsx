// --- React Methods
import React, { useContext, useMemo, useState } from "react";

import { usePlatforms } from "../hooks/usePlatforms";

// --- Chakra UI Elements
import { useDisclosure } from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import PageWidthGrid from "../components/PageWidthGrid";
import { PlatformScoreSpec, ScorerContext } from "../context/scorerContext";
import { Category } from "./Category";
import { CeramicContext } from "../context/ceramicContext";
import { GenericPlatform } from "./GenericPlatform";

export type CardListProps = {
  isLoading?: boolean;
  className?: string;
  initialOpen?: boolean;
};

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

export const CardList = ({ className, isLoading = false, initialOpen = true }: CardListProps): JSX.Element => {
  const { allProvidersState, allPlatforms } = useContext(CeramicContext);
  const { scoredPlatforms } = useContext(ScorerContext);
  const { platformProviderIds, platforms, platformCatagories } = usePlatforms();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentPlatform, setCurrentPlatform] = useState<PlatformScoreSpec | undefined>();

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

  sortedPlatforms.forEach((stamp) => {
    platformCatagories.forEach((category) => {
      if (category.platforms.includes(stamp.platform)) {
        groupedPlatforms[category.name].sortedPlatforms.push(stamp);
      }
    });
  });

  const allowList = scoredPlatforms.find((platform) => platform.platform.startsWith("AllowList"));
  const platformProps = currentPlatform?.platform && allPlatforms.get(currentPlatform.platform);

  // Use as in id staking
  return (
    <>
      <PageWidthGrid className={className}>
        {Object.keys(groupedPlatforms).map((category) => {
          const sortedPlatforms = groupedPlatforms[category].sortedPlatforms;
          const shouldDisplayCategory = sortedPlatforms.some((platform) => platform.possiblePoints > 0);
          if (!shouldDisplayCategory) return null;
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
