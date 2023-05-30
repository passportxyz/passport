import { PLATFORM_ID } from "@gitcoin/passport-types";
import { platforms, ProviderSpec, PlatformGroupSpec } from "@gitcoin/passport-platforms";
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
