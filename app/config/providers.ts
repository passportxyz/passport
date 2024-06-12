import { PLATFORM_ID } from "@gitcoin/passport-types";
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
  if (!customization) {
    return STAMP_PROVIDERS;
  }

  const customStampProviders = JSON.parse(JSON.stringify(STAMP_PROVIDERS)) as Providers;
  customStampProviders.AllowList = customStampProviders.AllowList.map((groupSpec) => {
    return {
      ...groupSpec,
      providers: groupSpec.providers.map((provider) => {
        if (provider.name === "AllowList") {
          return { ...provider, name: `${provider.name}#${customization.key}` };
        }
        return provider;
      }),
    };
  });
  return customStampProviders;
};
