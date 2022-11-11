import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
export class LinkedinPlatform extends Platform {
  platformId = "Linkedin";
  path = "linkedin";

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.state = options.state as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const linkedinUrl = await Promise.resolve(
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}&scope=r_emailaddress%20r_liteprofile`
    );
    return linkedinUrl;
  }
}
