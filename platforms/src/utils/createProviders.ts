// Provider Utils
import { Providers } from "./providers.js";
import { Provider } from "../types.js";
import { SimpleProvider } from "./simpleProvider.js";
import { SimpleEvmProvider } from "./simpleEvmProvider.js";
import { ClearTextSimpleProvider } from "./clearTextSimpleProvider.js";
import { ClearTextTwitterProvider, ClearTextGithubOrgProvider } from "../ClearText/index.js";

import { PlatformConfig } from "../platforms.js";
import { PROVIDER_ID } from "@gitcoin/passport-types";

export const createProviders = (platforms: Record<string, PlatformConfig>): Providers => {
  const platformProviders = Object.values(platforms)
    .map((platform) => platform.providers)
    .flat();

  const deprecatedProviderIds = Object.values(platforms)
    .map(({ ProviderConfig }) =>
      ProviderConfig.map(({ providers }) => providers.filter(({ isDeprecated }) => isDeprecated))
    )
    .flat(3)
    .map(({ name }) => name);

  const providerIsNotDeprecated = ({ type }: Provider) => !deprecatedProviderIds.includes(type as PROVIDER_ID);

  return new Providers(
    [
      // Example provider which verifies the payload when `payload.proofs.valid === "true"`
      new SimpleProvider(),
      new SimpleEvmProvider(),
      new ClearTextSimpleProvider(),
      new ClearTextTwitterProvider(),
      new ClearTextGithubOrgProvider(),
      ...platformProviders,
    ].filter(providerIsNotDeprecated)
  );
};
