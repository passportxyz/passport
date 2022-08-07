import { PROVIDER_ID } from "@gitcoin/passport-types";

export type ProviderSpec = {
  icon?: string | undefined;
  name: string;
  description: string;
};

export type Providers = {
  [provider in PROVIDER_ID]: ProviderSpec;
};

export const STAMP_PROVIDERS: Readonly<Providers> = {
  Google: {
    icon: "./assets/googleStampIcon.svg",
    name: "Google",
    description: "Google Authentication",
  },
  Ens: {
    icon: "./assets/ensStampIcon.svg",
    name: "Ens",
    description: "Ens name",
  },
  Poh: {
    icon: "./assets/pohStampIcon.svg",
    name: "POH",
    description: "Proof of Humanity",
  },
  Twitter: {
    icon: "./assets/twitterStampIcon.svg",
    name: "Twitter",
    description: "Twitter name",
  },
  POAP: {
    icon: "./assets/poapStampIcon.svg",
    name: "POAP",
    description: "POAP Verification",
  },
  Facebook: {
    icon: "./assets/facebookStampIcon.svg",
    name: "Facebook",
    description: "Facebook name",
  },
  Brightid: {
    icon: "./assets/brightidStampIcon.svg",
    name: "Bright ID",
    description: "Bright ID",
  },
  Github: {
    icon: "./assets/githubStampIcon.svg",
    name: "Github",
    description: "Github name",
  },
  Linkedin: {
    icon: "./assets/linkedinStampIcon.svg",
    name: "Linkedin",
    description: "Linkedin name",
  },
  Discord: {
    icon: "./assets/discordStampIcon.svg",
    name: "Discord",
    description: "Discord name",
  },
  SelfStakingBronze: {
    icon: "./assets/idstakingBronzeStampIcon.svg",
    name: "Self-Staking Bronze",
    description: "Verify Bronze Stake",
  },
  SelfStakingSilver: {
    icon: "./assets/idstakingSilverStampIcon.svg",
    name: "Self-Staking Silver",
    description: "Verify Silver Stake",
  },
  SelfStakingGold: {
    icon: "./assets/idstakingGoldStampIcon.svg",
    name: "Self-Staking Gold",
    description: "Verify Gold Stake",
  },
  CommunityStakingBronze: {
    icon: "./assets/idstakingBronzeStampIcon.svg",
    name: "Community Staking Bronze",
    description: "Verify Bronze Stake",
  },
  CommunityStakingSilver: {
    icon: "./assets/idstakingSilverStampIcon.svg",
    name: "Community Staking Silver",
    description: "Verify Silver Stake",
  },
  CommunityStakingGold: {
    icon: "./assets/idstakingGoldStampIcon.svg",
    name: "Community Staking Gold",
    description: "Verify Gold Stake",
  },
};
