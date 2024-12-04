// Provider Utils
import { Providers } from "./providers";
import { Provider } from "../types";
import { SimpleProvider } from "./simpleProvider";
import { SimpleEvmProvider } from "./simpleEvmProvider";
import { ClearTextSimpleProvider } from "./clearTextSimpleProvider";
import { ClearTextTwitterProvider, ClearTextGithubOrgProvider } from "../ClearText";

import { PlatformConfig } from "../platforms";
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
