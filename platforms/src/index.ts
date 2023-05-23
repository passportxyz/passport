// Provider Utils
import { Providers } from "./utils/providers";
import { SimpleProvider } from "./utils/simpleProvider";
import { ClearTextSimpleProvider } from "./utils/clearTextSimpleProvider";

import platforms from "./platforms";

Object.entries(platforms).map(([platformName, platform]) => {
  const { ProviderConfig, PlatformDetails, providers } = platform;
  if (!ProviderConfig) throw new Error(`No ProviderConfig defined in ${platformName}/Providers-config.ts`);
  if (!PlatformDetails) throw new Error(`No PlatformDetails defined in ${platformName}/Providers-config.ts`);
  if (!providers.length) throw new Error(`No providers defined in ${platformName}/Providers-config.ts`);
});

const platformProviders = Object.values(platforms)
  .map((platform) => platform.providers)
  .flat();

export const providers = new Providers([
  // Example provider which verifies the payload when `payload.proofs.valid === "true"`
  new SimpleProvider(),
  new ClearTextSimpleProvider(),
  ...platformProviders,
]);

/*
  [
  // TODO what to do with these?
  new ClearText.ClearTextGithubOrgProvider(),
  new ClearText.ClearTextTwitterProvider(),
]);
*/

export { Platform, AppContext, ProviderPayload, PlatformSpec } from "./types";
export { Platform as PlatformClass } from "./utils/platform";
