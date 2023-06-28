import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import {
  TenOrMoreGithubFollowers,
  FiftyOrMoreGithubFollowers,
  GithubProvider,
  ForkedGithubRepoProvider,
  StarredGithubRepoProvider,
  FiveOrMoreGithubRepos,
} from "./Providers";
import { GithubContributionActivityProvider } from "./Providers/githubContributionActivity";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/githubWhiteStampIcon.svg",
  platform: "Github",
  name: "Github",
  description: "Connect your existing Github account to verify.",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
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

export const providers: Provider[] = [
  new GithubProvider(),
  new FiveOrMoreGithubRepos(),
  new TenOrMoreGithubFollowers(),
  new FiftyOrMoreGithubFollowers(),
  new ForkedGithubRepoProvider(),
  new StarredGithubRepoProvider(),
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
