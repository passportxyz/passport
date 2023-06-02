// For details on the google oauth2 flow, please check the following ressources:
//  - https://developers.google.com/identity/protocols/oauth2
//  - https://developers.google.com/oauthplayground/

import { PlatformOptions, AuthInfo } from "../types";
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

  async getAuthInfo(state: string): Promise<AuthInfo> {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${this.redirectUri}&prompt=consent&response_type=code&client_id=${this.clientId}&scope=email+profile&access_type=offline&state=${state}`;
    return { authUrl };
  }
}
