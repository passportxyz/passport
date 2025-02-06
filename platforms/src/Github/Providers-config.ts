import { MAX_CONTRIBUTION_DAYS } from "../utils/githubClient.js";
import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { GithubContributionActivityProvider } from "./Providers/githubContributionActivity.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/githubWhiteStampIcon.svg",
  platform: "Github",
  name: "Github",
  description: "Connect to GitHub to verify your activity based on days with active commits.",
  connectMessage: "Connect Account",
  website: "https://github.com",
};

let providers: Provider[] = [];
let ProviderConfig: PlatformGroupSpec[] = [];

ProviderConfig = [
  {
    platformGroup: "Commit Days Credentials:",
    providers: [
      {
        title: "Made commits on at least 30 distinct days",
        name: "githubContributionActivityGte#30",
      },
      {
        title: "Made commits on at least 60 distinct days",
        name: "githubContributionActivityGte#60",
      },
      {
        title: "Made commits on at least 120 distinct days",
        name: "githubContributionActivityGte#120",
      },
    ],
  },
];

providers = [
  new GithubContributionActivityProvider({
    threshold: "30",
  }),
  new GithubContributionActivityProvider({
    threshold: "60",
  }),
  new GithubContributionActivityProvider({
    threshold: `${MAX_CONTRIBUTION_DAYS}`,
  }),
];

export { providers, ProviderConfig };
