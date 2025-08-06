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
  name: "Identity Staking",
  description: "Stake GTC to boost trust in the ecosystem",
  connectMessage: "Verify amount",
  website: "https://staking.passport.gitcoin.co/",
  isEVM: true,
  timeToGet: "10-20 minutes",
  price: "5-125 GTC + gas fees",
  cta: {
    label: "Start Staking",
    href: "https://stake.passport.xyz/",
  },
  guide: [
    {
      type: "steps",
      items: [
        {
          title: "Step 1",
          description: "Acquire GTC tokens on your preferred network (Ethereum, Optimism, or Arbitrum).",
          actions: [
            {
              label: "Get GTC Guide",
              href: "https://support.passport.xyz/passport-knowledge-base/gtc-staking/how-to-get-gtc-on-your-preferred-network",
            },
          ],
        },
        {
          title: "Step 2",
          description:
            "Choose to stake on yourself for self-staking credentials or stake on trusted community members for community credentials.",
          actions: [
            {
              label: "Start Staking",
              href: "https://stake.passport.xyz/",
            },
          ],
        },
        {
          title: "Step 3",
          description:
            "Select your staking amount and lockup period, then complete the authorization and staking transactions.",
        },
        {
          title: "Step 4",
          description: `Click "Check Eligibility" below to claim your credentials based on your staking activity.`,
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "Lower gas fees available on Optimism and Arbitrum networks",
        "Community credentials require interaction with other users' stakes",
        "All stakes have lockup periods and 90-day validity",
        "To be eligible for Trusted Community Leader, you must receive 20+ GTC stakes from each of the 5 different users, totalling over 100 GTC",
      ],
    },
  ],
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Self Staking",
    providers: [
      {
        title: "Bronze Staker",
        name: "SelfStakingBronze",
        description: "Stake 5 GTC on yourself",
      },
      {
        title: "Silver Staker",
        name: "SelfStakingSilver",
        description: "Stake 20 GTC on yourself",
      },
      {
        title: "Gold Staker",
        name: "SelfStakingGold",
        description: "Stake 125 GTC on yourself",
      },
    ],
  },
  {
    platformGroup: "Community Staking",
    providers: [
      {
        title: "Community Participant",
        description: "Engage in mutual trust by staking 5 GTC on others or receiving stakes from others",
        name: "BeginnerCommunityStaker",
      },
      {
        title: "Active Community Member",
        description: "Demonstrate network engagement through multiple 10+ GTC staking interactions",
        name: "ExperiencedCommunityStaker",
      },
      {
        title: "Trusted Community Leader",
        description: "Earn community recognition by receiving 20+ GTC stakes from each of at least 5 different users",
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
