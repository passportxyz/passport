import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";

export class LinkedinV2Platform extends Platform {
  platformId = "LinkedinV2";
  path = "linkedin";

  constructor(options: PlatformOptions = {}) {
    console.log("Hello DEBUG LinkedinPlatform");
    super();
    console.log("Hello DEBUG LinkedinPlatform options.clientId", options.clientId);
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.state = options.state as string;
    this.banner = {
      cta: {
        label: "Learn more",
        url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-a-linkedin-stamp-to-passport",
      },
    }
  }

  async getOAuthUrl(state: string): Promise<string> {
    console.log("Hello DEBUG getOAuthUrl clientId", this.clientId);
    const linkedinUrl = await Promise.resolve(
      `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}&scope=profile%email`
    );
    return linkedinUrl;
  }
}
