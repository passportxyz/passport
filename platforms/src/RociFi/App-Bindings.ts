import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class RociFiPlatform extends Platform {
  platformId = "RociFi";
  path = "RociFi";
  isEVM = true;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
