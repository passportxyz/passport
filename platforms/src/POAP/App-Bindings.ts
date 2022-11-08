/* eslint-disable */
import { Platform, AppContext, ProviderPayload } from "../types";

export class POAPPlatform implements Platform {
  platformId = "POAP";
  path = "POAP";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }
  
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
