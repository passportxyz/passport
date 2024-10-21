import { PlatformGroupSpec, PlatformSpec, platforms as platformDefinitions } from "@gitcoin/passport-platforms";
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
    platforms: ["Coinbase", "Holonym", "Outdid", "Binance"],
  },
  {
    name: "Social & Professional Platforms",
    description: "Link your profiles from established social media and professional networking sites for verification.",
    platforms: ["Github", "Linkedin", "LinkedinV2", "Google", "Discord"],
  },
  {
    name: "Biometric Verification",
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

  const platformProviderIds = useMemo(() => {
    return Array.from(allPlatformsMap).reduce(
      (platformProviderIds, [platformId, { platFormGroupSpec }]) => {
        const thisPlatformProviderIds =
          platFormGroupSpec.reduce((all, { providers }) => {
            return all.concat(providers.map(({ name }) => name));
          }, [] as PROVIDER_ID[]) || [];
        platformProviderIds[platformId] = thisPlatformProviderIds;
        return platformProviderIds;
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
    platformCatagories,
    platforms: allPlatformsMap,
  };
};
