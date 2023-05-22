import { PlatformSpec, PlatformGroupSpec } from "../types";

export const HypercertsPlatformDetails: PlatformSpec = {
  icon: "./assets/hypercertsStampIcon.svg",
  platform: "Hypercerts",
  name: "Hypercerts",
  description: "Connect your existing Hypercerts Account to verify",
  connectMessage: "Connect Account",
};

export const HypercertsProviderConfig: PlatformGroupSpec[] = [
  { platformGroup: "Account Name", providers: [{ title: "Hypercerts", name: "Hypercerts" }] },
];
