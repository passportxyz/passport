import { AppContext, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";

export class POAPPlatform extends Platform {
  platformId = "POAP";
  path = "POAP";
  isEVM = true;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
