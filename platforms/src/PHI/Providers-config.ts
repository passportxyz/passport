import { PlatformSpec, PlatformGroupSpec } from "../types";

export const PHIPlatformDetails: PlatformSpec = {
  icon: "./assets/phiLogoIcon.svg",
  platform: "PHI",
  name: "PHI",
  description: "Connect your wallet to verify your phi activity.",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const PHIProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "PHI Activity",
    providers: [
      { title: "Silver Rank", name: "PHIActivitySilver" },
      { title: "Gold Rank", name: "PHIActivityGold" },
    ],
  },
];
