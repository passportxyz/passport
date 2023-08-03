// ----- Types
import { ProviderOptions } from "../../types";
import { AlloStatisticsProvider } from "./alloStatistics";

// Export a Gitcoin Provider
export class AlloContributorStatisticsProvider extends AlloStatisticsProvider {
  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    super("AlloContributorStatistics", options);
    this.urlPath = "/allo/contributor_statistics";
  }
}
