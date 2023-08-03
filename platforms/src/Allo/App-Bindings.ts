import { PlatformOptions, AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class AlloPlatform extends Platform {
  platformId = "Allo";
  path = ""; // Not required for Allo
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    heading:
      "Only contributions made to Gitcoin's Allo Protocol rounds and donations eligible for matching are considered in these credentials.",
  };

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
