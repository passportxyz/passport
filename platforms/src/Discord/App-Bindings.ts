/* eslint-disable */
import { AccessTokenResult, AppContext, ProviderPayload, PlatformOptions } from "../types.js";
import { Platform } from "../utils/platform.js";

export class DiscordPlatform extends Platform {
  path = "discord";
  platformId = "Discord";

  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.banner = {
      cta: {
        label: "Learn more",
        url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-discord-account-to-passport",
      },
    };
  }

  async getOAuthUrl(state: string): Promise<string> {
    const authUrl = `https://discord.com/api/oauth2/authorize?response_type=code&scope=identify&client_id=${this.clientId}&state=${state}&redirect_uri=${this.redirectUri}`;
    return authUrl;
  }
}
