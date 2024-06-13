// --- React Methods
import React, { useContext, useEffect, useRef, useState } from "react";

import { PLATFORMS } from "../config/platforms";
import { PlatformGroupSpec, customStampProviders, getStampProviderIds } from "../config/providers";

// --- Chakra UI Elements
import { Drawer, DrawerOverlay, useDisclosure } from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID, PLATFORM_CATEGORY } from "@gitcoin/passport-types";
import PageWidthGrid from "../components/PageWidthGrid";
import { PlatformScoreSpec, ScorerContext } from "../context/scorerContext";
import { Category } from "./Category";
import { CeramicContext } from "../context/ceramicContext";
import { useCustomization } from "../hooks/useCustomization";
import { isDynamicCustomization } from "../utils/customizationUtils";

export type CardListProps = {
  isLoading?: boolean;
  className?: string;
  initialOpen?: boolean;
};

export const PLATFORM_CATEGORIES: PLATFORM_CATEGORY[] = [
  {
    name: "Blockchain & Crypto Networks",
    description: "Connect your blockchain-based profiles and assets to prove your identity.",
    platforms: [
      "ETH",
      "NFT",
      "GtcStaking",
      "Idena",
      "Gitcoin",
      "ZkSync",
      "GuildXYZ",
      "Lens",
      "Snapshot",
      "GnosisSafe",
      "Brightid",
      "TrustaLabs",
      "Ens",
      "AllowList",
    ],
  },
  {
    name: "Government IDs",
    description: "Use your government-issued IDs or complete a KYC process with our partners to verify your identity.",
    platforms: ["Coinbase", "Holonym"],
  },
  {
    name: "Social & Professional Platforms",
    description: "Link your profiles from established social media and professional networking sites for verification.",
    platforms: ["Github", "Linkedin", "Google", "Discord"],
  },
  {
    name: "Biometric Verification",
    description: "Connect your blockchain-based profiles and assets to prove your identity.",
    platforms: ["Civic"],
  },
];

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

export const CardList = ({ className, isLoading = false, initialOpen = true }: CardListProps): JSX.Element => {
  const { allProvidersState, allPlatforms } = useContext(CeramicContext);
  const { scoredPlatforms } = useContext(ScorerContext);
  const customization = useCustomization();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();

  const [currentProviders, setCurrentProviders] = useState<PlatformGroupSpec[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<SelectedProviders>(
    PLATFORMS.reduce((platforms, platform) => {
      // get all providerIds for this platform
      const providerIds = getStampProviderIds(
        platform.platform,
        customStampProviders(isDynamicCustomization(customization) ? customization : undefined)
      );
      // default to empty array for each platform
      platforms[platform.platform] = providerIds.filter(
        (providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined"
      );
      // return all platforms
      return platforms;
    }, {} as SelectedProviders)
  );

  useEffect(() => {
    // update all verfied states
    setSelectedProviders(
      PLATFORMS.reduce((platforms, platform) => {
        // get all providerIds for this platform
        const providerIds =
          customStampProviders(isDynamicCustomization(customization) ? customization : undefined)[
            platform.platform
          ]?.reduce((all, stamp) => {
            return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
          }, [] as PROVIDER_ID[]) || [];
        // default to empty array for each platform
        platforms[platform.platform] = providerIds.filter(
          (providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined"
        );
        // return all platforms
        return platforms;
      }, {} as SelectedProviders)
    );
  }, [allProvidersState]);

  const [verified, unverified] = scoredPlatforms.reduce(
    ([verified, unverified], platform): [PlatformScoreSpec[], PlatformScoreSpec[]] => {
      return platform.earnedPoints === 0 && selectedProviders[platform.platform].length === 0
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
      description: string;
      sortedPlatforms: PlatformScoreSpec[];
    };
  } = {};

  // Generate grouped stamps
  PLATFORM_CATEGORIES.forEach((category) => {
    groupedPlatforms[category.name] = {
      name: category.name,
      description: category.description,
      sortedPlatforms: [],
    };
  });

  sortedPlatforms.forEach((stamp) => {
    PLATFORM_CATEGORIES.forEach((category) => {
      if (category.platforms.includes(stamp.platform)) {
        groupedPlatforms[category.name].sortedPlatforms.push(stamp);
      }
    });
  });

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
      <Drawer isOpen={isOpen} placement="right" size="sm" onClose={onClose} finalFocusRef={btnRef.current}>
        <DrawerOverlay />
      </Drawer>
    </>
  );
};
