import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GithubSibylProvider } from "./Providers/githubSibyl/githubSibyl";
import { GithubSibylRepoStatisticsProvider } from "./Providers/githubSibyl/githubSibylRepoStatistics";
import { GithubSibylUsersStatisticsProvider } from "./Providers/githubSibyl/githubSibylUsersStatistics";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/cliqueStampIcon.png",
  platform: "Clique",
  name: "Clique",
  description: "Clique possession and transaction verification",
  connectMessage: "Verify Account",
  isEVM: false,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Github Account Name",
    providers: [{ title: "Encrypted", name: "CliqueGithub" }],
  },
  {
    platformGroup: "Github Followers",
    providers: [
      {
        title: "50 or more Github followers",
        name: "CliqueGithubUsers#numFollowersGithub#50",
      },
    ],
  },
  {
    platformGroup: "Github Repos",
    providers: [
      {
        title: "50 or more Github repos commits",
        name: "CliqueGithubRepo#sumCommitsPublicGithub#50",
      },
      {
        title: "50 or more Github repos contributions",
        name: "CliqueGithubRepo#sumContributedToPublicGithub#50",
      },
      {
        title: "50 or more Github repos issues",
        name: "CliqueGithubRepo#sumIssuesPublicGithub#50",
      },
      {
        title: "50 or more Github repos prs",
        name: "CliqueGithubRepo#sumPRsPublicGithub#50",
      },
      {
        title: "50 or more Github repos stars",
        name: "CliqueGithubRepo#sumStarsPublicGithub#50",
      },
    ],
  },
];

export const providers: Provider[] = [
  new GithubSibylProvider(),
  new GithubSibylUsersStatisticsProvider({
    threshold: 50,
    receivingAttribute: "numFollowersGithub",
    recordAttribute: "numFollowersGithub",
  }),

  new GithubSibylRepoStatisticsProvider({
    threshold: 50,
    receivingAttribute: "sumCommitsPublicGithub",
    recordAttribute: "sumCommitsPublicGithub",
  }),
  new GithubSibylRepoStatisticsProvider({
    threshold: 50,
    receivingAttribute: "sumContributedToPublicGithub",
    recordAttribute: "sumContributedToPublicGithub",
  }),
  new GithubSibylRepoStatisticsProvider({
    threshold: 50,
    receivingAttribute: "sumIssuesPublicGithub",
    recordAttribute: "sumIssuesPublicGithub",
  }),
  new GithubSibylRepoStatisticsProvider({
    threshold: 50,
    receivingAttribute: "sumPRsPublicGithub",
    recordAttribute: "sumPRsPublicGithub",
  }),
  new GithubSibylRepoStatisticsProvider({
    threshold: 50,
    receivingAttribute: "sumStarsPublicGithub",
    recordAttribute: "sumStarsPublicGithub",
  }),
];
