/* eslint-disable */
import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";

export class GooglePlatform extends Platform {
  platformId = "Google";
  path = "Google";
  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  getOAuthUrl(state: string): Promise<string> {
    return new Promise((resolve) => {
      resolve(
        `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${this.redirectUri}&prompt=consent&response_type=code&client_id=${this.clientId}&scope=email+profile&access_type=offline&state=${state}`
      );
    });
  }
}
