// ----- Types
import { ProviderOptions } from "../../../types";
import { GithubSibylStatisticsProvider } from "./githubSibylStatistics";

// Export a Gitcoin Provider
export class GithubSibylUsersStatisticsProvider extends GithubSibylStatisticsProvider {
  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    super("CliqueGithubUsers", options);
  }
}
