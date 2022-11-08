/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class LensPlatform implements Platform {
  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Lens";
  path = "Lens";
  clientId: string = null;
  redirectUri: string = null;
}
