// ----- Types
import { ProviderOptions } from "../../types.js";
import { GitcoinGrantStatisticsProvider } from "./gitcoinGrantsStatistics.js";

// Export a Gitcoin Provider
export class GitcoinContributorStatisticsProvider extends GitcoinGrantStatisticsProvider {
  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    super("GitcoinContributorStatistics", options);
    this.urlPath = "/contributor_statistics";
  }
}
