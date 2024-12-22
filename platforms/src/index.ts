// Provider Utils
import platforms from "./platforms";
import { createProviders } from "./utils/createProviders";
import { keccak256, toUtf8Bytes } from "ethers";
import { PlatformGroupSpec } from "./types";

// Check that all platforms have a ProviderConfig, PlatformDetails, and providers
Object.entries(platforms).map(([platformName, platform]) => {
  const { ProviderConfig, PlatformDetails, providers } = platform;
  if (!ProviderConfig) throw new Error(`No ProviderConfig defined in ${platformName}/Providers-config.ts`);
  if (!PlatformDetails) throw new Error(`No PlatformDetails defined in ${platformName}/Providers-config.ts`);
  if (!providers?.length) throw new Error(`No providers defined in ${platformName}/Providers-config.ts`);
});

// Set hash on each provider spec
Object.values(platforms).map(({ ProviderConfig }) => {
  ProviderConfig.map(({ providers }) => {
    providers.map((provider) => {
      provider.hash = keccak256(toUtf8Bytes(provider.name));
    });
  });
});

// This is used in tests & IAM only, not in the app
export const providers = createProviders(platforms);

const skipPlatforms = ["ClearText"];

type StampData = {
  name: string;
  description: string;
  hash: string;
};

type GroupData = {
  name: string;
  stamps: StampData[];
};

type PlatformData = {
  name: string;
  icon: string;
  description: string;
  connectMessage: string;
  groups: GroupData[];
};

const formatPlatformGroups = (providerConfig: PlatformGroupSpec[]) =>
  providerConfig.reduce(
    (groups: GroupData[], group: PlatformGroupSpec) => [
      ...groups,
      {
        name: group.platformGroup,
        stamps: group.providers.map(({ name, title, hash }) => {
          if (!hash) {
            throw new Error(`No hash defined for ${name}`);
          }
          return {
            name,
            hash,
            description: title,
          };
        }),
      },
    ],
    [] as GroupData[]
  );

export const platformsData = Object.entries(platforms).reduce((data, [id, platform]) => {
  if (skipPlatforms.includes(id)) return data;

  const { name, icon, description, connectMessage } = platform.PlatformDetails;
  if (!icon) throw new Error(`No icon defined for ${id}`);

  const groups = formatPlatformGroups(platform.ProviderConfig);

  return [
    ...data,
    {
      id,
      name,
      icon,
      description,
      connectMessage,
      groups,
    },
  ];
}, [] as PlatformData[]);

export * from "./types";
export { Platform as PlatformClass } from "./utils/platform";
export { platforms as platforms };
export { initCacheSession, loadCacheSession, clearCacheSession } from "./utils/platform-cache";
export { handleAxiosError } from "./utils/handleAxiosError";
export { PassportCache } from "./utils/passport-cache";
export { PlatformPreCheckError } from "./utils/platform";
export { Hyperlink } from "./utils/Hyperlink";
