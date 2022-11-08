/* eslint-disable */
import { Platform, PlatformOptions } from "../types";
export class LinkedinPlatform implements Platform {
  path = "Linkedin";
  platformId = "Linkedin";
  clientId: string;
  redirectUri: string;

  constructor(options: PlatformOptions = {}) {
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const linkedinUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CALLBACK}&state=${state}&scope=r_emailaddress%20r_liteprofile`;
    return linkedinUrl;
  }
}
