import { PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GitcoinPlatform extends Platform {
  platformId = "Gitcoin";
  path = "github";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    heading:
      "The Gitcoin Grant stamp recognizes contributions made during Gitcoin Grants rounds 1-15 (ended September 2022). Data from the latest rounds: Alpha (Jan '23) and Beta (April '23) is in the process of being added and should be added by Aug 15th.",
  };

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const githubUrl = await Promise.resolve(
      `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}`
    );
    return githubUrl;
  }
}
