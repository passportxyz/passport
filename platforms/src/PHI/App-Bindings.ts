import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class PHIPlatform extends Platform {
  platformId = "PHI";
  path = "PHI";
  isEVM = true;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
