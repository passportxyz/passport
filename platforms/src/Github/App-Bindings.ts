import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
export class GithubPlatform extends Platform {
  platformId = "Github";
  path = "github";
  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.banner = {
      heading: "Verifying Contribution Activity",
      content:
        "For the Contribution Activity credentials, make sure your contribution data is public. Go to Settings > Public Profile > Contributions & Activity and uncheck 'Make profile private and hide activity'. Verify your contribution history with your Gitcoin Passport!",
      cta: {
        label: "Learn more",
        url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-a-github-account-to-passport",
      },
    };
  }

  async getOAuthUrl(state: string): Promise<string> {
    const githubUrl = await Promise.resolve(
      `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}`
    );
    return githubUrl;
  }
}
