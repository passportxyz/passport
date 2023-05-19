import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { EthErc20PossessionProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gtcPossessionStampIcon.svg",
  platform: "GTC",
  name: "GTC",
  description: "GTC possession verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "GTC possessions",
    providers: [
      { title: "At least 10 GTC", name: "gtcPossessionsGte#10" },
      { title: "At least 100 GTC", name: "gtcPossessionsGte#100" },
    ],
  },
];

export const providers: Provider[] = [
  new EthErc20PossessionProvider({
    threshold: 100,
    recordAttribute: "gtcPossessionsGte",
    contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    error: "GTC Possessions >= 100 Provider verify Error",
  }),
  new EthErc20PossessionProvider({
    threshold: 10,
    recordAttribute: "gtcPossessionsGte",
    contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    error: "GTC Possessions >= 10 Provider verify Error",
  }),
];
