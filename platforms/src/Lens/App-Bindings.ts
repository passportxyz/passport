/* eslint-disable */
import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class LensPlatform extends Platform {
  platformId = "Lens";
  path = "Lens";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }
}
