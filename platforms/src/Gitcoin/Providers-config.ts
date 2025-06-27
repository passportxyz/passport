import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { GitcoinContributorStatisticsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gtcGrantsDarkIcon.svg",
  platform: "Gitcoin",
  name: "Gitcoin Grants",
  description: "Verify your Gitcoin Grants donations",
  connectMessage: "Verify Account",
  website: "https://www.gitcoin.co/program",
  isEVM: true,
  timeToGet: "5-10 minutes",
  price: "Variable",
  guide: [
    {
      type: "list",
      title: "Important considerations",
      items: [
        "If Gitcoin isn't hosting a Gitcoin-funded round at this time, you must wait until a new one opens to make a qualifying donation",
        "Only donations to official Gitcoin-funded rounds qualify (not community-run rounds)",
        "Your wallet must have a passing Passport score at time of donation",
        "Contributions are recognized approximately 3 weeks after round conclusion",
      ],
      actions: [
        {
          label: "View eligible rounds",
          href: "https://app.gitbook.com/o/zfm8EmCQlYR0QAHbSBOU/s/DvsXOocsOCtfUFRZHS8i/stamps/understanding-your-eligibility-for-the-gitcoin-grants-stamp-on-human-passport",
        },
      ],
    },
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description:
            "Make donations of at least $1 to projects during official Gitcoin-funded grants rounds using the same wallet address connected to your Passport.",
          actions: [
            {
              label: "See official rounds",
              href: "https://app.gitbook.com/o/zfm8EmCQlYR0QAHbSBOU/s/DvsXOocsOCtfUFRZHS8i/stamps/understanding-your-eligibility-for-the-gitcoin-grants-stamp-on-human-passport",
            },
          ],
        },
        {
          title: "Step 2",
          description:
            "Wait approximately 3 weeks after the grants round concludes for contributions to be processed and recognized.",
        },
        {
          title: "Step 3",
          description: `Click "Check Eligibility" below to claim your Gitcoin Stamp based on your total contribution amount.`,
        },
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Donation Tiers",
    providers: [
      {
        title: "Bronze Contributor",
        description: "Donate at least $10 to official Gitcoin grants rounds",
        name: "GitcoinContributorStatistics#totalContributionAmountGte#10",
      },
      {
        title: "Silver Contributor",
        description: "Donate at least $100 to official Gitcoin grants rounds",
        name: "GitcoinContributorStatistics#totalContributionAmountGte#100",
      },
      {
        title: "Gold Contributor",
        description: "Donate at least $1000 to official Gitcoin grants rounds",
        name: "GitcoinContributorStatistics#totalContributionAmountGte#1000",
      },
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
