import {
  PlatformGroupSpec,
  PlatformSpec,
  ProviderSpec,
  platforms as platformDefinitions,
} from "@gitcoin/passport-platforms";
import { useCustomization } from "../hooks/useCustomization";
import { useCallback, useMemo } from "react";
import { PLATFORM_CATEGORY, PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";
import { defaultPlatformMap, CUSTOM_PLATFORM_TYPE_INFO } from "../config/platformMap";
import { CUSTOM_CATEGORY_ID } from "../components/Category";

const { AllowList } = platformDefinitions;

export type Providers = {
  [platform in PLATFORM_ID]: PlatformGroupSpec[];
};

const BASE_PLATFORM_CATEGORIES: PLATFORM_CATEGORY[] = [
  {
    name: "Partner Stamps",
    description: "These are special stamps specific to each partner",
    id: CUSTOM_CATEGORY_ID,
    platforms: ["AllowList"],
  },
  {
    name: "Physical Verification",
    icon: (
      <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.332031" width="64" height="64" rx="30" fill="#F5F5F5" />
        <path
          d="M37.8332 29.6647H40.4998M37.8332 34.998H40.4998M24.7265 36.3314C25.0014 35.5501 25.512 34.8733 26.1879 34.3946C26.8638 33.9159 27.6716 33.6588 28.4998 33.6588C29.3281 33.6588 30.1359 33.9159 30.8118 34.3946C31.4877 34.8733 31.9983 35.5501 32.2732 36.3314M31.1665 30.998C31.1665 32.4708 29.9726 33.6647 28.4998 33.6647C27.0271 33.6647 25.8332 32.4708 25.8332 30.998C25.8332 29.5253 27.0271 28.3314 28.4998 28.3314C29.9726 28.3314 31.1665 29.5253 31.1665 30.998ZM21.8332 22.998H43.1665C44.6393 22.998 45.8332 24.192 45.8332 25.6647V38.998C45.8332 40.4708 44.6393 41.6647 43.1665 41.6647H21.8332C20.3604 41.6647 19.1665 40.4708 19.1665 38.998V25.6647C19.1665 24.192 20.3604 22.998 21.8332 22.998Z"
          stroke="#737373"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    description: "Includes verification methods that require verifying a real-world object or biometrics",
    platforms: ["Binance", "Biometrics", "Civic", "CleanHands", "Coinbase", "HumanIdKyc", "HumanIdPhone"],
  },
  {
    name: "Blockchain Networks and Activities",
    icon: (
      <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.332031" width="64" height="64" rx="30" fill="#F5F5F5" />
        <path
          d="M45.8332 32.3314C45.8332 39.6952 39.8636 45.6647 32.4998 45.6647M45.8332 32.3314C45.8332 24.9676 39.8636 18.998 32.4998 18.998M45.8332 32.3314H19.1665M32.4998 45.6647C25.136 45.6647 19.1665 39.6952 19.1665 32.3314M32.4998 45.6647C29.0762 42.0698 27.1665 37.2957 27.1665 32.3314C27.1665 27.367 29.0762 22.5929 32.4998 18.998M32.4998 45.6647C35.9235 42.0698 37.8332 37.2957 37.8332 32.3314C37.8332 27.367 35.9235 22.5929 32.4998 18.998M19.1665 32.3314C19.1665 24.9676 25.136 18.998 32.4998 18.998"
          stroke="#737373"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    description: "Verify onchain activity, token holdings, and participation in blockchain ecosystems",
    platforms: [
      "Brightid",
      "Ens",
      "ETH",
      "Gitcoin",
      "GtcStaking",
      "GuildXYZ",
      "Idena",
      "Lens",
      "NFT",
      "GnosisSafe",
      "Snapshot",
      "TrustaLabs",
      "ZkSync",
    ],
  },
  {
    name: "Web2 Platforms & Services",
    icon: (
      <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.332031" width="64" height="64" rx="30" fill="#F5F5F5" />
        <path
          d="M40.4998 42.998C40.4998 40.8763 39.657 38.8415 38.1567 37.3412C36.6564 35.8409 34.6216 34.998 32.4998 34.998M32.4998 34.998C30.3781 34.998 28.3433 35.8409 26.843 37.3412C25.3427 38.8415 24.4998 40.8763 24.4998 42.998M32.4998 34.998C35.4454 34.998 37.8332 32.6102 37.8332 29.6647C37.8332 26.7192 35.4454 24.3314 32.4998 24.3314C29.5543 24.3314 27.1665 26.7192 27.1665 29.6647C27.1665 32.6102 29.5543 34.998 32.4998 34.998ZM45.8332 32.3314C45.8332 39.6952 39.8636 45.6647 32.4998 45.6647C25.136 45.6647 19.1665 39.6952 19.1665 32.3314C19.1665 24.9676 25.136 18.998 32.4998 18.998C39.8636 18.998 45.8332 24.9676 45.8332 32.3314Z"
          stroke="#737373"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    description: "Connect traditional web platforms and services to demonstrate digital presence",
    platforms: ["Discord", "Github", "Google", "Linkedin", "X", "Steam", "ZKEmail"],
  },
];

const customPlatformNameToId = (name: string): PLATFORM_ID => `Custom#${name}`;

export const usePlatforms = () => {
  const { partnerName, customStamps, allowListProviders } = useCustomization();

  const allPlatformDefinitions = useMemo(() => {
    const customPlatformDefinitions = Object.entries(customStamps || {}).reduce(
      (customPlatformDefinitions, [platformName, { platformType, iconUrl, displayName, description, isEVM }]) => {
        const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[platformType];
        if (!platformTypeInfo) {
          console.warn(`Unknown custom platform type: ${platformType} for platform ${platformName}, skipping`);
          return customPlatformDefinitions;
        }
        const basePlatformSpecs = platformDefinitions[platformTypeInfo.basePlatformName].PlatformDetails;

        const platformId = customPlatformNameToId(platformName);

        customPlatformDefinitions[platformId] = {
          PlatformDetails: {
            platform: platformId,
            icon: iconUrl || basePlatformSpecs.icon,
            name: displayName || basePlatformSpecs.name,
            description: description || basePlatformSpecs.description,
            connectMessage: basePlatformSpecs.connectMessage,
            isEVM: isEVM ?? basePlatformSpecs.isEVM,
          },
        };
        return customPlatformDefinitions;
      },
      {} as Record<string, { PlatformDetails: PlatformSpec }>
    );

    return { ...platformDefinitions, ...customPlatformDefinitions };
  }, [customStamps]);

  const allPlatformsMap: Map<PLATFORM_ID, PlatformProps> = useMemo(() => {
    const platformsMap = new Map(defaultPlatformMap);
    if (allowListProviders) {
      // Set AllowList platform providers based on customization
      platformsMap.set("AllowList", {
        platform: new AllowList.AllowListPlatform(),
        platFormGroupSpec: allowListProviders,
        isEVM: AllowList.PlatformDetails.isEVM,
      });
    }

    if (customStamps) {
      for (const [platformId, { platformType, banner, credentials, isEVM }] of Object.entries(customStamps)) {
        const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[platformType];
        if (!platformTypeInfo) {
          console.warn(`Unknown custom platform type: ${platformType}, skipping`);
          continue;
        }

        // Not sure how to make typescript happy here, should probably figure
        // this out at some point
        // @ts-ignore
        const platform = new platformTypeInfo.platformClass(platformTypeInfo.platformParams);

        if (banner.header || banner.content || banner.cta.text || banner.cta.url) {
          if (!platform.banner) platform.banner = {};
          if (banner.header) platform.banner.heading = banner.header;
          if (banner.content) platform.banner.content = banner.content;
          if (banner.cta.text && banner.cta.url) platform.banner.cta = { label: banner.cta.text, url: banner.cta.url };
        }

        const platFormGroupSpec = [
          {
            platformGroup: "Credentials",
            providers: credentials.map(({ providerId, displayName, description }) => ({
              title: displayName,
              description,
              name: providerId,
            })),
          },
        ];

        platformsMap.set(`Custom#${platformId}`, {
          platform,
          platFormGroupSpec,
          isEVM: isEVM ?? platformDefinitions[platformTypeInfo.basePlatformName]?.PlatformDetails?.isEVM ?? false,
        });
      }
    }

    return platformsMap;
  }, [allowListProviders, customStamps]);

  const platformSpecs = useMemo(() => {
    return Object.values(allPlatformDefinitions).map((platform) => platform.PlatformDetails);
  }, [allPlatformDefinitions]);

  const platformGroupSpecs = useMemo(() => {
    return Array.from(allPlatformsMap).reduce((groupSpecs, [platformId, { platFormGroupSpec }]) => {
      groupSpecs[platformId] = platFormGroupSpec;
      return groupSpecs;
    }, {} as Providers);
  }, [allPlatformsMap]);

  const getPlatformSpec = useCallback(
    (platformId: PLATFORM_ID): PlatformSpec => {
      return allPlatformDefinitions[platformId].PlatformDetails;
    },
    [allPlatformDefinitions]
  );

  const platformProviders = useMemo(() => {
    return Array.from(allPlatformsMap).reduce(
      (platformProviderIds, [platformId, { platFormGroupSpec }]) => {
        const thisPlatformProviderIds = platFormGroupSpec.reduce((all, { providers }) => {
          return all.concat(providers);
        }, [] as ProviderSpec[]);
        platformProviderIds[platformId] = thisPlatformProviderIds;
        return platformProviderIds;
      },
      {} as Record<PLATFORM_ID, ProviderSpec[]>
    );
  }, [allPlatformsMap]);

  const platformProviderIds = useMemo(() => {
    return Object.entries(platformProviders).reduce(
      (platformProviderIdMap, [platformId, providers]) => {
        platformProviderIdMap[platformId as PLATFORM_ID] = providers.map(({ name }) => name);
        return platformProviderIdMap;
      },
      {} as Record<PLATFORM_ID, PROVIDER_ID[]>
    );
  }, [allPlatformsMap]);

  const platformCategories = useMemo(() => {
    return BASE_PLATFORM_CATEGORIES.map((category) => {
      if (category.id === CUSTOM_CATEGORY_ID) {
        return {
          ...category,
          name: `${partnerName} Stamps`,
          platforms: [...category.platforms, ...Object.keys(customStamps || {}).map(customPlatformNameToId)],
        };
      } else {
        return category;
      }
    });
  }, [customStamps, partnerName]);

  return {
    getPlatformSpec,
    platformSpecs,
    platformGroupSpecs,
    platformProviderIds,
    platformProviders,
    platformCategories,
    platforms: allPlatformsMap,
  };
};
