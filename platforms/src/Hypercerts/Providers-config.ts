import { PlatformSpec, PlatformGroupSpec } from "../types";

export const HypercertsPlatformDetails: PlatformSpec = {
  icon: "./assets/hypercertsStampIcon.svg",
  platform: "Hypercerts",
  name: "Hypercerts",
  description: "Connect your wallet to verify that you hold Hypercerts",
  connectMessage: "Connect Wallet",
  isEVM: true,
};

export const HypercertsProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Account Name",
    providers: [{ title: "Held at least two Hypercerts for more than 15 days", name: "Hypercerts" }],
  },
];
