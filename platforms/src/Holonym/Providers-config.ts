import { PlatformSpec, PlatformGroupSpec } from "../types";

export const HolonymPlatformDetails: PlatformSpec = {
  icon: "./assets/holonymStampIcon.svg",
  platform: "Holonym",
  name: "Holonym",
  description: "Mint a Holo to verify your account",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const HolonymProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Government ID",
    providers: [{ title: "Proven uniqueness using Holonym with government ID", name: "HolonymGovIdProvider" }],
  },
];
