import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";

export class CustomNFTPlatform extends Platform {
  platformId = "NFTHolder";
  path = "NFTHolder";

  constructor(options: PlatformOptions = {}) {
    super();
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }
}
