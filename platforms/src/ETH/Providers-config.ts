import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { EthGasProvider, FirstEthTxnProvider, EthGTEOneTxnProvider } from "./Providers/ethTransactions";
import { EthErc20PossessionProvider } from "./Providers/ethErc20Possession";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/ethereumStampIcon.svg",
  platform: "ETH",
  name: "ETH",
  description: "ETH possession and transaction verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Possessions",
    providers: [
      { title: "At least 1 ETH", name: "ethPossessionsGte#1" },
      { title: "At least 10 ETH", name: "ethPossessionsGte#10" },
      { title: "At least 32 ETH", name: "ethPossessionsGte#32" },
    ],
  },
  {
    platformGroup: "Transactions",
    providers: [
      { title: "First ETH transaction occurred more than 30 days ago", name: "FirstEthTxnProvider" },
      { title: "At least 1 ETH transaction", name: "EthGTEOneTxnProvider" },
    ],
  },
  {
    platformGroup: "Gas fees spent",
    providers: [{ title: "At least 0.5 ETH in gas fees spent", name: "EthGasProvider" }],
  },
];

export const providers: Provider[] = [
  new EthGasProvider(),
  new FirstEthTxnProvider(),
  new EthGTEOneTxnProvider(),
  new EthErc20PossessionProvider({
    threshold: 32,
    recordAttribute: "ethPossessionsGte",
    error: "ETH Possessions >= 32 Provider verify Error",
  }),
  new EthErc20PossessionProvider({
    threshold: 10,
    recordAttribute: "ethPossessionsGte",
    error: "ETH Possessions >= 10 Provider verify Error",
  }),
  new EthErc20PossessionProvider({
    threshold: 1,
    recordAttribute: "ethPossessionsGte",
    error: "ETH Possessions >= 1 Provider verify Error",
  }),
];
