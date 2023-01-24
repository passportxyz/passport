import { PlatformSpec, PlatformGroupSpec } from "../types";

export const HolonymPlatformDetails: PlatformSpec = {
  icon: "./assets/holonymStampIcon.svg",
  platform: "Holonym",
  name: "Holonym",
  description:
    "To verify your Holo, mint your Holo at app.holonym.id and then prove uniqueness at app.holonym.id/prove/uniqueness",
  connectMessage: "Connect Account",
  isEVM: true,
};

export const HolonymProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Government ID",
    providers: [{ title: "Proven uniqueness using Holonym with government ID", name: "HolonymGovIdProvider" }],
  },
];
