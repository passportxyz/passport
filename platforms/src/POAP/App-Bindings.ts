import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class POAPPlatform extends Platform {
  platformId = "POAP";
  path = "POAP";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
