import { PlatformGroupSpec, PlatformSpec, platforms as platformDefinitions } from "@gitcoin/passport-platforms";
import { useCustomization } from "../hooks/useCustomization";
import { useCallback, useMemo } from "react";
import { CUSTOM_PLATFORM_TYPE_INFO } from "../utils/customizationUtils";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";

const {
  Ens,
  Lens,
  Github,
  Gitcoin,
  NFT,
  GnosisSafe,
  Snapshot,
  POAP,
  ETH,
  ZkSync,
  Discord,
  Linkedin,
  GtcStaking,
  Google,
  Brightid,
  Coinbase,
  GuildXYZ,
  Holonym,
  Idena,
  Civic,
  TrustaLabs,
  Outdid,
  AllowList,
  Binance,
} = platformDefinitions;

export type Providers = {
  [platform in PLATFORM_ID]: PlatformGroupSpec[];
};

const defaultPlatformMap = new Map<PLATFORM_ID, PlatformProps>();

defaultPlatformMap.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.ProviderConfig,
});

defaultPlatformMap.set("NFT", {
  platform: new NFT.NFTPlatform(),
  platFormGroupSpec: NFT.ProviderConfig,
});

defaultPlatformMap.set("Github", {
  platform: new Github.GithubPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Github.ProviderConfig,
});

defaultPlatformMap.set("Gitcoin", {
  platform: new Gitcoin.GitcoinPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Gitcoin.ProviderConfig,
});

defaultPlatformMap.set("Snapshot", {
  platform: new Snapshot.SnapshotPlatform(),
  platFormGroupSpec: Snapshot.ProviderConfig,
});

defaultPlatformMap.set("ZkSync", {
  platform: new ZkSync.ZkSyncPlatform(),
  platFormGroupSpec: ZkSync.ProviderConfig,
});

defaultPlatformMap.set("Lens", {
  platform: new Lens.LensPlatform(),
  platFormGroupSpec: Lens.ProviderConfig,
});

defaultPlatformMap.set("GnosisSafe", {
  platform: new GnosisSafe.GnosisSafePlatform(),
  platFormGroupSpec: GnosisSafe.ProviderConfig,
});

defaultPlatformMap.set("ETH", {
  platform: new ETH.ETHPlatform(),
  platFormGroupSpec: ETH.ProviderConfig,
});

if (process.env.NEXT_PUBLIC_FF_NEW_POAP_STAMPS === "on") {
  defaultPlatformMap.set("POAP", {
    platform: new POAP.POAPPlatform(),
    platFormGroupSpec: POAP.ProviderConfig,
  });
}

defaultPlatformMap.set("Discord", {
  platform: new Discord.DiscordPlatform(),
  platFormGroupSpec: Discord.ProviderConfig,
});

defaultPlatformMap.set("Linkedin", {
  platform: new Linkedin.LinkedinPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CALLBACK,
  }),
  platFormGroupSpec: Linkedin.ProviderConfig,
});

defaultPlatformMap.set("GtcStaking", {
  platform: new GtcStaking.GTCStakingPlatform(),
  platFormGroupSpec: GtcStaking.ProviderConfig,
});

defaultPlatformMap.set("Google", {
  platform: new Google.GooglePlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CALLBACK,
  }),
  platFormGroupSpec: Google.ProviderConfig,
});

defaultPlatformMap.set("Brightid", {
  platform: new Brightid.BrightidPlatform(),
  platFormGroupSpec: Brightid.ProviderConfig,
});

defaultPlatformMap.set("Coinbase", {
  platform: new Coinbase.CoinbasePlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_COINBASE_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_COINBASE_CALLBACK,
  }),
  platFormGroupSpec: Coinbase.ProviderConfig,
});

if (process.env.NEXT_PUBLIC_FF_OUTDID_STAMP === "on") {
  defaultPlatformMap.set("Outdid", {
    platform: new Outdid.OutdidPlatform({
      clientId: process.env.NEXT_PUBLIC_OUTDID_API_KEY,
      redirectUri: process.env.NEXT_PUBLIC_PASSPORT_OUTDID_CALLBACK,
    }),
    platFormGroupSpec: Outdid.ProviderConfig,
  });
}

if (process.env.NEXT_PUBLIC_FF_GUILD_STAMP === "on") {
  defaultPlatformMap.set("GuildXYZ", {
    platform: new GuildXYZ.GuildXYZPlatform(),
    platFormGroupSpec: GuildXYZ.ProviderConfig,
  });
}

if (process.env.NEXT_PUBLIC_FF_HOLONYM_STAMP === "on") {
  defaultPlatformMap.set("Holonym", {
    platform: new Holonym.HolonymPlatform(),
    platFormGroupSpec: Holonym.ProviderConfig,
  });
}

if (process.env.NEXT_PUBLIC_FF_IDENA_STAMP === "on") {
  defaultPlatformMap.set("Idena", {
    platform: new Idena.IdenaPlatform(),
    platFormGroupSpec: Idena.ProviderConfig,
  });
}

defaultPlatformMap.set("Civic", {
  platform: new Civic.CivicPlatform({
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_CIVIC_CALLBACK,
  }),
  platFormGroupSpec: Civic.ProviderConfig,
});

if (process.env.NEXT_PUBLIC_FF_TRUSTALABS_STAMPS === "on") {
  defaultPlatformMap.set("TrustaLabs", {
    platform: new TrustaLabs.TrustaLabsPlatform(),
    platFormGroupSpec: TrustaLabs.ProviderConfig,
  });
}

if (process.env.NEXT_PUBLIC_FF_BINANCE_STAMPS === "on") {
  defaultPlatformMap.set("Binance", {
    platform: new Binance.BinancePlatform(),
    platFormGroupSpec: Binance.ProviderConfig,
  });
}

export const usePlatforms = () => {
  const { customStamps, allowListProviders } = useCustomization();

  const allPlatformDefinitions = useMemo(() => {
    const customPlatformDefinitions = Object.entries(customStamps || {}).reduce(
      (customPlatformDefinitions, [platformId, { platformType, iconUrl, displayName, description }]) => {
        const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[platformType];
        const basePlatformSpecs = platformDefinitions[platformTypeInfo.name]?.PlatformDetails;

        customPlatformDefinitions[`Custom#${platformId}`] = {
          PlatformDetails: {
            platform: platformTypeInfo.name,
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

  const allPlatformsMap = useMemo(() => {
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

  return {
    getPlatformSpec,
    platformSpecs,
    platformGroupSpecs,
    platformProviderIds,
    platforms: allPlatformsMap,
  };
};
