import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class TrustaLabsPlatform extends Platform {
  platformId = "TrustaLabs";
  path = "TrustaLabs";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
