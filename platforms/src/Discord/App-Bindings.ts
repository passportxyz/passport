/* eslint-disable */
import { AccessTokenResult, AppContext, ProviderPayload, PlatformOptions } from "../types";
import { Platform } from "../utils/platform";

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
    const authUrl = `https://discord.com/api/oauth2/authorize?response_type=code&scope=identify&client_id=${process.env.NEXT_PUBLIC_PASSPORT_DISCORD_CLIENT_ID}&state=${state}&redirect_uri=${process.env.NEXT_PUBLIC_PASSPORT_DISCORD_CALLBACK}`;
    return authUrl;
  }
}
