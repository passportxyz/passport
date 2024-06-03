// --- React Methods
import React, { useContext, useEffect, useRef, useState } from "react";

import { PLATFORMS } from "../config/platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS } from "../config/providers";

// --- Components
import { LoadingCard } from "./LoadingCard";
import { GenericPlatform } from "./GenericPlatform";

// --- Identity Providers
import { SideBarContent } from "./SideBarContent";

// --- Chakra UI Elements
import { Drawer, DrawerOverlay, useDisclosure } from "@chakra-ui/react";
import { PLATFORM_ID, PROVIDER_ID, PLATFORM_CATEGORY } from "@gitcoin/passport-types";
import PageWidthGrid from "../components/PageWidthGrid";
import { PlatformScoreSpec, ScorerContext } from "../context/scorerContext";
import { Category } from "./Category";
import { CeramicContext } from "../context/ceramicContext";

export type CardListProps = {
  isLoading?: boolean;
  className?: string;
  initialOpen?: boolean;
};

// TODO : where should this be defined?
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

export const getStampProviderIds = (platform: PLATFORM_ID): PROVIDER_ID[] => {
  return (
    STAMP_PROVIDERS[platform]?.reduce((all, stamp) => {
      return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
    }, [] as PROVIDER_ID[]) || []
  );
};

export const CardList = ({ className, isLoading = false, initialOpen = true }: CardListProps): JSX.Element => {
  const { allProvidersState, allPlatforms } = useContext(CeramicContext);
  const { scoredPlatforms } = useContext(ScorerContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();

  const [currentProviders, setCurrentProviders] = useState<PlatformGroupSpec[]>([]);
  const [currentPlatform, setCurrentPlatform] = useState<PlatformScoreSpec | undefined>();
  const [selectedProviders, setSelectedProviders] = useState<SelectedProviders>(
    PLATFORMS.reduce((platforms, platform) => {
      // get all providerIds for this platform
      const providerIds = getStampProviderIds(platform.platform);
      // default to empty array for each platform
      platforms[platform.platform] = providerIds.filter(
        (providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined"
      );
      // return all platforms
      return platforms;
    }, {} as SelectedProviders)
  );
  const [dropDownOpen, setDropDownOpen] = useState<boolean>(false);
  const openRef = React.useRef(dropDownOpen);
  openRef.current = dropDownOpen;

  // Unmounting the panel on a delay to allow the animation to complete
  const [panelMounted, setPanelMounted] = useState<boolean>(false);

  useEffect(() => {
    if (initialOpen) {
      handleOpen();
    }
  }, [initialOpen]);

  const handleOpen = () => {
    setPanelMounted(true);
  };

  useEffect(() => {
    // Causes this to open one render after mounting, so animation can play
    setDropDownOpen(panelMounted);
  }, [panelMounted]);

  const handleClose = () => {
    setDropDownOpen(false);
    setTimeout(() => {
      // Only unmount the panel if it's still closed
      // Need to use ref to access runtime state here
      const isOpen = openRef.current;
      if (!isOpen) setPanelMounted(false);
    }, 150);
  };

  const handleClick = () => {
    if (dropDownOpen) handleClose();
    else handleOpen();
  };

  useEffect(() => {
    // update all verfied states
    setSelectedProviders(
      PLATFORMS.reduce((platforms, platform) => {
        // get all providerIds for this platform
        const providerIds =
          STAMP_PROVIDERS[platform.platform]?.reduce((all, stamp) => {
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

  // Add the platforms to this switch so the sidebar content can populate dynamically
  const renderCurrentPlatformSelection = () => {
    if (currentPlatform) {
      const platformProps = allPlatforms.get(currentPlatform.platform);
      if (platformProps) {
        return (
          <GenericPlatform
            platform={platformProps.platform}
            platformScoreSpec={currentPlatform}
            platFormGroupSpec={platformProps.platFormGroupSpec}
            onClose={onClose}
          />
        );
      }
    }
    return (
      <SideBarContent
        verifiedProviders={undefined}
        selectedProviders={undefined}
        setSelectedProviders={undefined}
        currentPlatform={undefined}
        currentProviders={undefined}
        isLoading={undefined}
        verifyButton={undefined}
        onClose={onClose}
      />
    );
  };

  useEffect(() => {
    // set providers for the current platform
    if (currentPlatform) {
      setCurrentProviders(STAMP_PROVIDERS[currentPlatform.platform]);
    }
  }, [currentPlatform]);

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
        {/* <Disclosure as="div" className={className} defaultOpen={true}> */}
        {Object.keys(groupedPlatforms).map((category) => {
          return <Category className={className} category={groupedPlatforms[category]} key={category} />;
        })}
      </PageWidthGrid>
      {/* sidebar */}
      {currentProviders && (
        <Drawer isOpen={isOpen} placement="right" size="sm" onClose={onClose} finalFocusRef={btnRef.current}>
          <DrawerOverlay />
          {renderCurrentPlatformSelection()}
        </Drawer>
      )}
    </>
  );
};
