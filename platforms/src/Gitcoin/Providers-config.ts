import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GitcoinContributorStatisticsProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gtcGrantsLightIcon.svg",
  platform: "Gitcoin",
  name: "Gitcoin",
  description: "Connect with Github to verify with your Gitcoin account.",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Contributed to...",
    providers: [
      { title: "at least 1 Grant", name: "GitcoinContributorStatistics#numGrantsContributeToGte#1" },
      { title: "at least 10 Grants", name: "GitcoinContributorStatistics#numGrantsContributeToGte#10" },
      { title: "at least 25 Grants", name: "GitcoinContributorStatistics#numGrantsContributeToGte#25" },
      { title: "at least 100 Grants", name: "GitcoinContributorStatistics#numGrantsContributeToGte#100" },
    ],
  },
  {
    platformGroup: "Contributed ($)...",
    providers: [
      { title: "at least $10", name: "GitcoinContributorStatistics#totalContributionAmountGte#10" },
      { title: "at least $100", name: "GitcoinContributorStatistics#totalContributionAmountGte#100" },
      { title: "at least $1000", name: "GitcoinContributorStatistics#totalContributionAmountGte#1000" },
    ],
  },
  {
    platformGroup: "Contributed in...",
    providers: [
      { title: "GR14", name: "GitcoinContributorStatistics#numGr14ContributionsGte#1" },
      { title: "at least 1 Round", name: "GitcoinContributorStatistics#numRoundsContributedToGte#1" },
    ],
  },
];

export const providers: Provider[] = [
  // --- GitcoinContributorStatisticsProvider ---
  new GitcoinContributorStatisticsProvider({
    threshold: 1,
    receivingAttribute: "num_grants_contribute_to",
    recordAttribute: "numGrantsContributeToGte",
  }),
  new GitcoinContributorStatisticsProvider({
    threshold: 10,
    receivingAttribute: "num_grants_contribute_to",
    recordAttribute: "numGrantsContributeToGte",
  }),
  new GitcoinContributorStatisticsProvider({
    threshold: 25,
    receivingAttribute: "num_grants_contribute_to",
    recordAttribute: "numGrantsContributeToGte",
  }),
  new GitcoinContributorStatisticsProvider({
    threshold: 100,
    receivingAttribute: "num_grants_contribute_to",
    recordAttribute: "numGrantsContributeToGte",
  }),
  new GitcoinContributorStatisticsProvider({
    threshold: 10,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmountGte",
  }),
  new GitcoinContributorStatisticsProvider({
    threshold: 100,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmountGte",
  }),
  new GitcoinContributorStatisticsProvider({
    threshold: 1000,
    receivingAttribute: "total_contribution_amount",
    recordAttribute: "totalContributionAmountGte",
  }),
  new GitcoinContributorStatisticsProvider({
    threshold: 1,
    receivingAttribute: "num_rounds_contribute_to",
    recordAttribute: "numRoundsContributedToGte",
  }),
  new GitcoinContributorStatisticsProvider({
    threshold: 1,
    receivingAttribute: "num_gr14_contributions",
    recordAttribute: "numGr14ContributionsGte",
  }),
];
