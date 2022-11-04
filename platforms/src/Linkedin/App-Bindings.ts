/* eslint-disable */
import { Platform, PlatformOptions } from "../types";

export class LinkedinPlatform implements Platform {
  platformId = "Linkedin";
  path = "linkedin";
  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}&scope=r_emailaddress%20r_liteprofile`;
  }
}
