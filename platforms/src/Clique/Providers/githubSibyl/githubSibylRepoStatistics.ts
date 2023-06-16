// ----- Types
import { ProviderOptions } from "../../../types";
import { GithubSibylStatisticsProvider } from "./githubSibylStatistics";

// Export a Gitcoin Provider
export class GithubSibylRepoStatisticsProvider extends GithubSibylStatisticsProvider {
  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    super("CliqueGithubRepo", options);
  }
}
