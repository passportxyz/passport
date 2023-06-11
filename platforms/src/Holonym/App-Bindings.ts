/* eslint-disable */
import { AppContext, Platform, ProviderPayload } from "../types";

export class HolonymPlatform implements Platform {
  platformId = "Holonym";
  path = "Holonym";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
