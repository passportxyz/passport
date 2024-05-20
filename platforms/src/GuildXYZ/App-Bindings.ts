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
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-guild-stamp-to-passport",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
