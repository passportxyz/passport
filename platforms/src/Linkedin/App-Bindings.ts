import { PlatformOptions } from "../types.js";
import { Platform } from "../utils/platform.js";

export class LinkedinPlatform extends Platform {
  platformId = "Linkedin";
  path = "linkedin";

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.state = options.state as string;
    this.banner = {
      cta: {
        label: "Learn more",
        url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-a-linkedin-stamp-to-passport",
      },
    };
  }

  async getOAuthUrl(state: string): Promise<string> {
    const AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: "profile email openid",
      state: state,
    });

    const url = `${AUTH_URL}?${params.toString()}`;

    const linkedinUrl = await Promise.resolve(url);
    return linkedinUrl;
  }
}
