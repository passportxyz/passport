/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class NFTPlatform implements Platform {
  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "NFT";
  path = "NFT";
  clientId: string = null;
  redirectUri: string = null;
};
