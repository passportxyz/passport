import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { platforms, ProviderSpec, PlatformGroupSpec } from "@gitcoin/passport-platforms";
import { DynamicCustomization } from "../utils/customizationUtils";
export type { ProviderSpec, PlatformGroupSpec };

export type UpdatedPlatforms = {
  [key: string]: boolean;
};

// Platform -> Provider[]
export type Providers = {
  [platform in PLATFORM_ID]: PlatformGroupSpec[];
};

const providerConfigs = Object.entries(platforms).reduce(
  (configs, [platformName, platform]) => ({
    ...configs,
    [platformName]: platform?.ProviderConfig,
  }),
  {} as Record<PLATFORM_ID, PlatformGroupSpec[]>
);

export const STAMP_PROVIDERS: Readonly<Providers> = {
  ...providerConfigs,
  Signer: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Signer" }],
    },
  ],
};

export const customStampProviders = (customization?: DynamicCustomization): Providers => {
  if (!customization || !customization.allowListProviders) {
    return STAMP_PROVIDERS;
  }

  const customStampProviders = JSON.parse(JSON.stringify(STAMP_PROVIDERS)) as Providers;
  customStampProviders.AllowList = customization.allowListProviders;
  return customStampProviders;
};

export const getStampProviderIds = (platform: PLATFORM_ID, providers: Providers): PROVIDER_ID[] => {
  return (
    providers[platform]?.reduce((all, stamp) => {
      return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
    }, [] as PROVIDER_ID[]) || []
  );
};
