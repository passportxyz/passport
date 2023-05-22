import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";

export class HypercertsPlatform extends Platform {
  platformId = "Hypercerts";
  path = "Hypercerts";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
