/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class SnapshotPlatform implements Platform {
  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
  platformId = "Snapshot";
  path = "Snapshot";
  clientId: string = null;
  redirectUri: string = null;
}
