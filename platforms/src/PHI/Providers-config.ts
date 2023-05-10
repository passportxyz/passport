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
      { title: "Active Rank Silver I ~ V (Earn 65,000 EXP ~ on Active Score)", name: "PHIActivitySilver" },
      { title: "Active Rank Gold I ~ V (Earn 150,000 EXP ~ on Active Score)", name: "PHIActivityGold" },
    ],
  },
];
