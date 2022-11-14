import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class NFTPlatform extends Platform {
  platformId = "NFT";
  path = "NFT";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
