import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import {
  SelfStakingBronzeProvider,
  SelfStakingGoldProvider,
  SelfStakingSilverProvider,
  BeginnerCommunityStakerProvider,
  ExperiencedCommunityStakerProvider,
  TrustedCitizenProvider,
} from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/gtcStakingLogoIcon.svg",
  platform: "GtcStaking",
  name: "GTC Staking",
  description: "Stake GTC to boost your trust in the Gitcoin ecosystem.",
  connectMessage: "Verify amount",
  website: "https://staking.passport.gitcoin.co/",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Self GTC Staking",
    providers: [
      {
        title: "5 GTC (Bronze)",
        name: "SelfStakingBronze",
        description: "Beginner staking level showcasing initial commitment and engagement with the community.",
      },
      {
        title: "20 GTC (Silver)",
        name: "SelfStakingSilver",
        description:
          "Intermediate staking level demonstrating a stronger involvement and contribution to the Passport XYZ network.",
      },
      {
        title: "125 GTC (Gold)",
        name: "SelfStakingGold",
        description: "Advanced staking level reflecting a substantial commitment and leadership within the community.",
      },
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
          "Participate in two staking actions, each involving at least 10 GTC. Options include: staking on two different accounts, receiving stakes from two different accounts, or a mutual stake. Every stake must be a minimum of 10 GTC.",
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
