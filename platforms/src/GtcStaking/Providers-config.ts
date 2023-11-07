import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import {
  SelfStakingBronzeProvider,
  SelfStakingGoldProvider,
  SelfStakingSilverProvider,
  BeginnerCommunityStakerProvider,
  ExperiencedCommunityStakerProvider,
  TrustedCitizenProvider,
} from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gtcStakingLogoIcon.svg",
  platform: "GtcStaking",
  name: "GTC Staking",
  description: "Connect to Passport to verify your staking amount",
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
      {
        title: "Beginner Community Staker",
        description: "Stake 5 GTC on at least 1 account or have 1 account stake 5 GTC on you.",
        name: "BeginnerCommunityStaker",
      },
      {
        title: "Experienced Community Staker",
        description:
          "Stake 10 GTC on at least 2 accounts or have 2 accounts stake 10 GTC on you. If someone stakes 10 GTC on you and you stake 10 GTC on them, that also qualifies.",
        name: "ExperiencedCommunityStaker",
      },
      {
        title: "Trusted Citizen",
        description: "Receive stakes from 5 unique users, each staking a minimum of 20 GTC on you.",
        name: "TrustedCitizen",
      },
    ],
  },
];

export const providers: Provider[] = [
  new SelfStakingBronzeProvider(),
  new SelfStakingSilverProvider(),
  new SelfStakingGoldProvider(),
  new BeginnerCommunityStakerProvider(),
  new ExperiencedCommunityStakerProvider(),
  new TrustedCitizenProvider(),
];
