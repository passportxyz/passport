import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GithubContributionActivityProvider } from "./Providers/githubContributionActivity";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/githubWhiteStampIcon.svg",
  platform: "Github",
  name: "Github",
  description: "Connect to GitHub to verify your code contributions.",
  connectMessage: "Connect Account",
  website: "https://github.com",
};

let providers: Provider[] = [];
let ProviderConfig: PlatformGroupSpec[] = [];

ProviderConfig = [
  {
    platformGroup: "Contribution Activity",
    providers: [
      {
        title: "Contributions on at least 30 distinct days",
        name: "githubContributionActivityGte#30",
      },
      {
        title: "Contributions on at least 60 distinct days",
        name: "githubContributionActivityGte#60",
      },
      {
        title: "Contributions on at least 120 distinct days",
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
    threshold: "120",
  }),
];

export { providers, ProviderConfig };
