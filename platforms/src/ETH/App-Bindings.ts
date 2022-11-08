/* eslint-disable */
import { AppContext, Platform, ProviderPayload } from "../types";

export class ETHPlatform implements Platform {
  platformId = "ETH";
  path = "ETH";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
