/* eslint-disable */
import { AppContext, Platform, ProviderPayload } from "../../types";

export class GooglePlatform implements Platform {
  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }
  
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Google";
  path = "Google";
}
