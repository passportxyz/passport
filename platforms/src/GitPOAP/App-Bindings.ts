/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class GitPOAPPlatform implements Platform {
  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  
  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "GitPOAP";
  path = "GitPOAP";
  clientId: string = null;
  redirectUri: string = null;
}
