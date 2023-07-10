import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { providers } from "./Providers-config";
import { CivicPassProvider } from "./Providers/civic";
import { CivicPassType } from "./Providers/types";

const DEFAULT_SCOPE = "uniqueness";

const mapProviderIDToScope = (provider: PROVIDER_ID): string | undefined => {
  const foundProvider = providers.find((p) => p.type === provider);
  const passType = (foundProvider as CivicPassProvider)?.passType;
  if (passType) {
    return CivicPassType[passType].toLowerCase();
  }
  return undefined;
};

export class CivicPlatform extends Platform {
  platformId = "Civic";
  path = "Civic";
  isEVM = true;

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  getOAuthUrl(state?: string, providers?: PROVIDER_ID[]): Promise<string> {
    const scope = providers?.length >= 1 ? mapProviderIDToScope(providers[0]) : DEFAULT_SCOPE;
    return Promise.resolve(`https://getpass.civic.com?state=${state}&scope=${scope}&redirect_uri=${this.redirectUri}`);
  }

  banner = {
    heading: "Choose a pass type and click Verify.",
    content:
      "For the best experience, switch to your desired network in your wallet first. Alternatively, visit the link below to get multiple passes.",
    cta: {
      label: "Get Civic Pass",
      url: "https://getpass.civic.com",
    },
  };
}
