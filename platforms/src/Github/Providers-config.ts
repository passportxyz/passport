import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GithubProvider } from "./Providers";
import { GithubAccountCreationProvider } from "./Providers/githubAccountCreation";
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

export const providers: Provider[] = [
  new GithubProvider(),
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
