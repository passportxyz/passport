import React from "react";
import { PlatformOptions } from "../types.js";
import { Platform } from "../utils/platform.js";

export class GithubPlatform extends Platform {
  platformId = "Github";
  path = "github";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    content:
      "Contribution Activity credentials focus on commit days. Ensure your contribution history is public by going to Settings > Public Profile > Contributions & Activity and unchecking 'Make profile private and hide activity'.",
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
