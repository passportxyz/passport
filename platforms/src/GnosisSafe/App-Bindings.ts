/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class GnosisSafePlatform implements Platform {
  platformId = "GnosisSafe";
  path = "GnosisSafe";
  clientId: string = null;
  redirectUri: string = null;

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }
}
