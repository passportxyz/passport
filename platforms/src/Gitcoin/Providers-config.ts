import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { GitcoinContributorStatisticsProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gtcGrantsLightIcon.svg",
  platform: "Gitcoin",
  name: "Gitcoin",
  description: "Verify your Gitcoin Grants contributions",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://www.gitcoin.co",
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
];
