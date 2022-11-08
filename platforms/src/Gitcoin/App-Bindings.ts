import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

/* eslint-disable */
export class GitcoinPlatform implements Platform {
  platformId = "Gitcoin";
  path = "github";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  
  constructor(options: PlatformOptions = {}) {
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}`;
    
    return githubUrl;
  }
}
