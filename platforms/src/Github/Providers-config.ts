import { MAX_CONTRIBUTION_DAYS } from "../utils/githubClient.js";
import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { GithubContributionActivityProvider } from "./Providers/githubContributionActivity.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/githubStampIcon.svg",
  platform: "Github",
  name: "GitHub",
  description: "Verify your GitHub activity",
  connectMessage: "Connect Account",
  website: "https://github.com",
  timeToGet: "5-10 minutes",
  price: "Free",
  guide: [
    {
      type: "list",
      title: "Stamp Requirements",
      items: [
        "Only Commits qualify for the Stamp. No other contributions or activities will qualify",
        "We track Commit days rather than volume of commits. This means that if you make multiple commits on a single day, it will only count as one Commit day",
        "Only commits in the past 3 years qualify",
        "Commits made while the repo was hosted by another Git platform don't count. The repo must be hosted by GitHub at the time of the commit for it to qualify",
        "Commits to repos that are currently public qualify, regardless of whether they were private at the time of the commit",
        "Your privacy controls can be either set to public or private",
      ],
    },
  ],
};

let providers: Provider[] = [];
let ProviderConfig: PlatformGroupSpec[] = [];

ProviderConfig = [
  {
    platformGroup: "Developer Activity",
    providers: [
      {
        title: "Regular Contributor",
        description: "Demonstrate consistent coding activity with commits on at least 30 different days",
        name: "githubContributionActivityGte#30",
      },
      {
        title: "Active Developer",
        description: "Show sustained coding engagement with commits on at least 60 different days",
        name: "githubContributionActivityGte#60",
      },
      {
        title: "Dedicated Coder",
        description: "Reflect long-term coding commitment with commits on at least 120 different days",
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
