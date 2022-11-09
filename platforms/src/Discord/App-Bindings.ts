/* eslint-disable */
import { Platform, AccessTokenResult, AppContext, ProviderPayload, PlatformOptions } from "../types";

export class DiscordPlatform implements Platform {
  path = "discord";
  platformId = "Discord";

  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const authUrl: string = await this.getOAuthUrl(appContext.state);
    const width = 600;
    const height = 800;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;

    // Pass data to the page via props
    appContext.window.open(
      authUrl,
      "_blank",
      "toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=" +
        width +
        ", height=" +
        height +
        ", top=" +
        top +
        ", left=" +
        left
    );

    return appContext.waitForRedirect();
  }

  async getOAuthUrl(state: string): Promise<string> {
    const authUrl = `https://discord.com/api/oauth2/authorize?response_type=code&scope=identify&client_id=${process.env.NEXT_PUBLIC_PASSPORT_DISCORD_CLIENT_ID}&state=${state}&redirect_uri=${process.env.NEXT_PUBLIC_PASSPORT_DISCORD_CALLBACK}`;
    return authUrl;
  }
}
