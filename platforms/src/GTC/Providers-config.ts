import { PlatformSpec, PlatformGroupSpec } from "../types";

export const GTCPlatformDetails: PlatformSpec = {
  icon: "./assets/gtcPossessionStampIcon.svg",
  platform: "GTC",
  name: "GTC",
  description: "GTC possession verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const GTCProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "GTC possessions",
    providers: [
      { title: "At least 10 GTC", name: "gtcPossessionsGte#10" },
      { title: "At least 100 GTC", name: "gtcPossessionsGte#100" },
    ],
  },
];
