import { PlatformSpec, PlatformGroupSpec } from "../types";

export const GithubPlatformDetails: PlatformSpec = {
  icon: "./assets/githubWhiteStampIcon.svg",
  platform: "Github",
  name: "Github",
  description: "Connect your existing Github account to verify.",
  connectMessage: "Connect Account",
};

export const GithubProviderConfig: PlatformGroupSpec[] = [
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
