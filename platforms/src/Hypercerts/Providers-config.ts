import { PlatformSpec, PlatformGroupSpec } from "../types";

export const HypercertsPlatformDetails: PlatformSpec = {
  icon: "./assets/hypercertsStampIcon.svg",
  platform: "Hypercerts",
  name: "Hypercerts",
  description: "Connect your wallet to verify that you hold a Hypercert",
  connectMessage: "Connect Wallet",
};

export const HypercertsProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Account Name", providers: [{ title: "Holds at least 1 Hypercert", name: "Hypercerts" }] },
];
