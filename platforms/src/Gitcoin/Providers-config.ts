import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { GitcoinContributorStatisticsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gtcGrantsLightIcon.svg",
  platform: "Gitcoin",
  name: "Gitcoin",
  description: "Verify your participation in Gitcoin Grants rounds.",
  connectMessage: "Verify Account",
  website: "https://www.gitcoin.co/program",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
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
