import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import {
  SelfStakingBronzeProvider,
  SelfStakingGoldProvider,
  SelfStakingSilverProvider,
  CommunityStakingBronzeProvider,
  CommunityStakingGoldProvider,
  CommunityStakingSilverProvider,
} from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gtcStakingLogoIcon.svg",
  platform: "GtcStaking",
  name: "GTC Staking",
  description: "Connect to passport to verify your staking amount.",
  connectMessage: "Verify amount",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Self GTC Staking",
    providers: [
      { title: "5 GTC (Bronze)", name: "SelfStakingBronze" },
      { title: "20 GTC (Silver)", name: "SelfStakingSilver" },
      { title: "125 GTC (Gold)", name: "SelfStakingGold" },
    ],
  },
  {
    platformGroup: "Community GTC Staking",
    providers: [
      { title: "5 GTC (Bronze)", name: "CommunityStakingBronze" },
      { title: "20 GTC (Silver)", name: "CommunityStakingSilver" },
      { title: "125 GTC (Gold)", name: "CommunityStakingGold" },
    ],
  },
];

export const providers: Provider[] = [
  new SelfStakingBronzeProvider(),
  new SelfStakingSilverProvider(),
  new SelfStakingGoldProvider(),
  new CommunityStakingBronzeProvider(),
  new CommunityStakingSilverProvider(),
  new CommunityStakingGoldProvider(),
];
