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
  description: "Stake GTC to boost your trust in the Gitcoin ecosystem.",
  connectMessage: "Verify amount",
  website: "https://staking.passport.gitcoin.co/",
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
        description: "Stake 5 GTC on one account or have one account stake 5 GTC on you.",
        name: "BeginnerCommunityStaker",
      },
      {
        title: "Experienced Community Staker",
        description: `At least two community stakes of at least 10 GTC each (a
                     minimum of 20 GTC total). Options include: staking on two
                     different accounts, receiving stakes from two different
                     accounts, or a mutual stake.`,
        name: "ExperiencedCommunityStaker",
      },
      {
        title: "Trusted Citizen",
        description: `At least five community stakes of at least 20 GTC each (a
                     minimum of 100 GTC total). Options include: staking on five
                     different accounts, receiving stakes from five different
                     accounts, or a mix.`,
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
