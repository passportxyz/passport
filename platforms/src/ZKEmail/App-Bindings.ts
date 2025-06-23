// For details on the google oauth2 flow, please check the following ressources:
//  - https://developers.google.com/identity/protocols/oauth2
//  - https://developers.google.com/oauthplayground/

import { PlatformOptions } from "../types.js";
import { Platform } from "../utils/platform.js";

export class ZKEmailPlatform extends Platform {
  platformId = "ZKEmail";
  path = "ZKEmail";
  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    // this.banner = {
    //   cta: {
    //     label: "Learn more",
    //     url: "",
    //   },
    // };
  }

  getOAuthUrl(state: string): Promise<string> {
    return new Promise((resolve) => {
      resolve(
        `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${this.redirectUri}&prompt=consent&response_type=code&client_id=${this.clientId}&scope=email+profile+https://www.googleapis.com/auth/gmail.readonly&access_type=offline&state=${state}`
      );
    });
  }
}
