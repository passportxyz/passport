/* eslint-disable */
import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GTCPlatform extends Platform {
  platformId = "GTC";
  path = "GTC";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }
}
