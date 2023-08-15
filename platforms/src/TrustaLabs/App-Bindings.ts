import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class TrustaLabsPlatform extends Platform {
  platformId = "TrustaLabs";
  path = "TrustaLabs";
  isEVM = true;

  async getProviderPayload(_appContext: AppContext): Promise<ProviderPayload> {
    return await Promise.resolve({});
  }
}
