import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import {
  ETHAdvocateProvider,
  ETHMaxiProvider,
  ETHEnthusiastProvider,
  EthGasSpentProvider,
  EthDaysActiveProvider,
  EthTransactionsProvider,
} from "./Providers/accountAnalysis.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/ethereumStampIcon.svg",
  platform: "ETH",
  name: "Ethereum",
  description: "Verify Ethereum activity.",
  connectMessage: "Verify Account",
  isEVM: true,
  website:
    "https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/navigating-your-ethereum-stamp-insights-and-updates",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Engagement Milestones",
    providers: [
      {
        title: "ETH Enthusiast",
        name: "ETHScore#50",
        description: "Marks the initiation of engagement within the Ethereum ecosystem.",
      },
      {
        title: "ETH Advocate",
        name: "ETHScore#75",
        description: "Represents a higher level of commitment and activity.",
      },
      {
        title: "ETH Maxi",
        name: "ETHScore#90",
        description: "Denotes exceptional involvement and dedication.",
      },
    ],
  },
  {
    platformGroup: "Your Ethereum Activity Metrics",
    providers: [
      {
        title: "Spend more than 0.25 ETH on gas",
        name: "ETHGasSpent#0.25",
        description: "Highlights significant financial engagement with the network.",
      },
      {
        title: "Execute over 100 transactions",
        name: "ETHnumTransactions#100",
        description: "Indicates a robust level of transactional activity.",
      },
      {
        title: "Active on over 50 distinct days",
        name: "ETHDaysActive#50",
        description: "Showcases sustained interaction with Ethereum.",
      },
    ],
  },
];

export const providers: Provider[] = [
  new ETHEnthusiastProvider(),
  new ETHAdvocateProvider(),
  new ETHMaxiProvider(),
  new EthGasSpentProvider(),
  new EthDaysActiveProvider(),
  new EthTransactionsProvider(),
];
