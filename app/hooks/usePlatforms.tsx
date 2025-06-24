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

const BASE_PLATFORM_CATAGORIES: PLATFORM_CATEGORY[] = [
  {
    name: "Partner Stamps",
    description: "These are special stamps specific to each partner",
    id: CUSTOM_CATEGORY_ID,
    platforms: ["AllowList"],
  },
  {
    name: "Blockchain & Crypto Networks",
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
      "PhoneVerification",
    ],
  },
  {
    name: "Government IDs",
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
    description: "Use your government-issued IDs or complete a KYC process with our partners to verify your identity.",
    platforms: ["Coinbase", "Holonym", "Outdid", "Binance", "CleanHands", "HumanIdPhone", "HumanIdKyc"],
  },
  {
    name: "Social & Professional Platforms",
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
    description: "Link your profiles from established social media and professional networking sites for verification.",
    platforms: ["Github", "Linkedin", "Google", "Discord"],
  },
  {
    name: "Biometric Verification",
    icon: (
      <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.332031" width="64" height="64" rx="30" fill="#F5F5F5" />
        <path
          d="M20.5 25.6654V22.9987C20.5 22.2915 20.781 21.6132 21.281 21.1131C21.7811 20.613 22.4594 20.332 23.1667 20.332H25.8333M39.1667 20.332H41.8333C42.5406 20.332 43.2189 20.613 43.719 21.1131C44.219 21.6132 44.5 22.2915 44.5 22.9987V25.6654M44.5 38.9987V41.6654C44.5 42.3726 44.219 43.0509 43.719 43.551C43.2189 44.0511 42.5406 44.332 41.8333 44.332H39.1667M25.8333 44.332H23.1667C22.4594 44.332 21.7811 44.0511 21.281 43.551C20.781 43.0509 20.5 42.3726 20.5 41.6654V38.9987M27.1667 34.9987C27.1667 34.9987 29.1667 37.6654 32.5 37.6654C35.8333 37.6654 37.8333 34.9987 37.8333 34.9987M28.5 28.332H28.5133M36.5 28.332H36.5133"
          stroke="#737373"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    description: "Connect your blockchain-based profiles and assets to prove your identity.",
    platforms: ["Civic"],
  },
];

const customPlatformNameToId = (name: string): PLATFORM_ID => `Custom#${name}`;

export const usePlatforms = () => {
  const { partnerName, customStamps, allowListProviders } = useCustomization();

  const allPlatformDefinitions = useMemo(() => {
    const customPlatformDefinitions = Object.entries(customStamps || {}).reduce(
      (customPlatformDefinitions, [platformName, { platformType, iconUrl, displayName, description }]) => {
        const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[platformType];
        const basePlatformSpecs = platformDefinitions[platformTypeInfo.basePlatformName].PlatformDetails;

        const platformId = customPlatformNameToId(platformName);

        customPlatformDefinitions[platformId] = {
          PlatformDetails: {
            platform: platformId,
            icon: iconUrl || basePlatformSpecs.icon,
            name: displayName || basePlatformSpecs.name,
            description: description || basePlatformSpecs.description,
            connectMessage: basePlatformSpecs.connectMessage,
            isEVM: basePlatformSpecs.isEVM,
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
      });
    }

    if (customStamps) {
      for (const [platformId, { platformType, banner, credentials }] of Object.entries(customStamps)) {
        const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[platformType];
        if (!platformTypeInfo) throw new Error(`Unknown custom platform type: ${platformType}`);

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

  const platformCatagories = useMemo(() => {
    return BASE_PLATFORM_CATAGORIES.map((category) => {
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
  }, [customStamps]);

  return {
    getPlatformSpec,
    platformSpecs,
    platformGroupSpecs,
    platformProviderIds,
    platformProviders,
    platformCatagories,
    platforms: allPlatformsMap,
  };
};
