import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GitcoinPlatform extends Platform {
  platformId = "Gitcoin";
  path = "Gitcoin";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    heading: `
      The Gitcoin Grant stamp recognizes contributions made during
      all Gitcoin Grants rounds 1-18 (ended August 2023). Donations
      made in the current round will not be counted until post-round
      analysis is completed, usually ~3 weeks from the round end.
      Only matching-eligible contributions for each round are counted.
    `
      .replace(/\s+/gm, " ")
      .trim(),
  };

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(_appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
