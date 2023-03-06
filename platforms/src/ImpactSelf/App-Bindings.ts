import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class ImpactSelfPlatform extends Platform {
  platformId = "ImpactSelf";
  path = "ImpactSelf";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
