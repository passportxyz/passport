import { PlatformSpec, PlatformGroupSpec } from "../types";

export const GTCStakingPlatformDetails: PlatformSpec = {
  icon: "./assets/gtcStakingLogoIcon.svg",
  platform: "GtcStaking",
  name: "GTC Staking",
  description: "Connect to passport to verify your staking amount.",
  connectMessage: "Verify amount",
  isEVM: true,
};

export const GTCStakingProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Self GTC Staking",
    providers: [
      { title: "1 GTC (Bronze)", name: "SelfStakingBronze" },
      { title: "10 GTC (Silver)", name: "SelfStakingSilver" },
      { title: "100 GTC (Gold)", name: "SelfStakingGold" },
    ],
  },
  {
    platformGroup: "Community GTC Staking",
    providers: [
      { title: "1 GTC (Bronze)", name: "CommunityStakingBronze" },
      { title: "10 GTC (Silver)", name: "CommunityStakingSilver" },
      { title: "100 GTC (Gold)", name: "CommunityStakingGold" },
    ],
  },
];

// TODO: allow adding additional content to the side panel: Stake your GTC on the new Identity Staking site.
