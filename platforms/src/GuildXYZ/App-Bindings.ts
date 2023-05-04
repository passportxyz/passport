/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class GuildXYZPlatform implements Platform {
  platformId = "GuildXYZ";
  path = "GuildXYZ";
  isEVM = true;
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    heading: "*Qualifying guilds have more than 250 members",
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
