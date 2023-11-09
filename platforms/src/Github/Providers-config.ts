import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GithubAccountCreationProvider } from "./Providers/githubAccountCreation";
import { GithubContributionActivityProvider } from "./Providers/githubContributionActivity";
import * as legacyProviders from "./Providers/legacy";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/githubWhiteStampIcon.svg",
  platform: "Github",
  name: "Github",
  description: "Connect your existing Github account to verify.",
  connectMessage: "Connect Account",
  website: {
    uri: "https://github.com",
    display: "Connect to GitHub to verify your code contributions.",
  },
};

let providers: Provider[] = [];
let ProviderConfig: PlatformGroupSpec[] = [];

if (process.env.FF_NEW_GITHUB_STAMPS === "on" || process.env.NEXT_PUBLIC_FF_NEW_GITHUB_STAMPS === "on") {
  ProviderConfig = [
    {
      platformGroup: "Account Creation",
      providers: [
        {
          title: "Created at least 90 days ago",
          name: "githubAccountCreationGte#90",
        },
        {
          title: "Created at least 180 days ago",
          name: "githubAccountCreationGte#180",
        },
        {
          title: "Created at least 365 days ago",
          name: "githubAccountCreationGte#365",
        },
      ],
    },
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
    new GithubAccountCreationProvider({
      threshold: "90",
    }),
    new GithubAccountCreationProvider({
      threshold: "180",
    }),
    new GithubAccountCreationProvider({
      threshold: "365",
    }),
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
} else {
  ProviderConfig = [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Github" }],
    },
    {
      platformGroup: "Repositories",
      providers: [
        {
          title: "Five or more Github repos",
          name: "FiveOrMoreGithubRepos",
        },
        {
          title: "At least 1 Github repo forked by another user",
          name: "ForkedGithubRepoProvider",
        },
        {
          title: "At least 1 Github repo starred by another user",
          name: "StarredGithubRepoProvider",
        },
      ],
    },
    {
      platformGroup: "Followers",
      providers: [
        {
          title: "Ten or more Github followers",
          name: "TenOrMoreGithubFollowers",
        },
        {
          title: "Fifty or more Github followers",
          name: "FiftyOrMoreGithubFollowers",
        },
      ],
    },
  ];

  providers = [
    new legacyProviders.GithubProvider(),
    new legacyProviders.FiveOrMoreGithubRepos(),
    new legacyProviders.TenOrMoreGithubFollowers(),
    new legacyProviders.FiftyOrMoreGithubFollowers(),
    new legacyProviders.ForkedGithubRepoProvider(),
    new legacyProviders.StarredGithubRepoProvider(),
  ];
}

export { providers, ProviderConfig };
