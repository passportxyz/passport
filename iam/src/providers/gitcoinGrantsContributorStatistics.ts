// ----- Types
import { ProviderOptions } from "../types";
import { GitcoinGrantStatisticsProvider } from "./gitcoinGrantsStatistics";

// Export a Gitcoin Provider
export class GitcoinContributorStatisticsProvider extends GitcoinGrantStatisticsProvider {
  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    super("GitcoinContributorStatistics", options);
    this.dataUrl = "https://gitcoin.co/grants/v1/api/vc/contributor_statistics";
  }
}
