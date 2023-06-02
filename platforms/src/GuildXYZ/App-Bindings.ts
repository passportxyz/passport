/* eslint-disable */
import { AppContext, Platform, ProviderPayload } from "../types";

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
}
