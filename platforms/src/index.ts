// Provider Utils
import platforms from "./platforms";
import { keccak256, toUtf8Bytes } from "ethers";
import { createProviders } from "utils/createProviders";

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

export const providers = createProviders(platforms);

export * from "./types";
export { Platform as PlatformClass } from "./utils/platform";
export { platforms as platforms };
export { initCacheSession, loadCacheSession, clearCacheSession } from "./utils/platform-cache";
export { handleAxiosError } from "./utils/handleAxiosError";
export { PassportCache } from "./utils/passport-cache";
export { PlatformPreCheckError } from "./utils/platform";
export { Hyperlink } from "./utils/Hyperlink";
