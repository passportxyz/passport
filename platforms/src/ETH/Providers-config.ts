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
  description: "Verify your Ethereum (Mainnet & L2s) transaction history",
  connectMessage: "Verify Account",
  isEVM: true,
  website:
    "https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/navigating-your-ethereum-stamp-insights-and-updates",
  timeToGet: "< 1 minute",
  price: "Free",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Network Participation Levels",
    providers: [
      {
        title: "ETH Enthusiast",
        name: "ETHScore#50",
        description:
          "Show authentic engagement patterns within the Ethereum ecosystem (and L2s) based on transaction quality and diversity",
      },
      {
        title: "ETH Advocate",
        name: "ETHScore#75",
        description: "Demonstrate higher-quality transaction patterns that indicate genuine network participation",
      },
      {
        title: "ETH Maxi",
        name: "ETHScore#90",
        description: "Exhibit exceptional transaction diversity and authentic usage patterns across Ethereum networks",
      },
    ],
  },
  {
    platformGroup: "Ethereum Activity Metrics",
    providers: [
      {
        title: "Spend more than 0.25 ETH on gas",
        name: "ETHGasSpent#0.25",
        description: "Demonstrate significant gas spending",
      },
      {
        title: "Execute over 100 transactions",
        name: "ETHnumTransactions#100",
        description: "Exhibit high transaction volume",
      },
      {
        title: "Active on over 50 distinct days",
        name: "ETHDaysActive#50",
        description: "Show sustained activity over time",
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
