/* eslint-disable */
import { AppContext, Platform, ProviderPayload } from "../types";

export class MicapassPlatform implements Platform {
  platformId = "Micapass";
  path = "Micapass";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
