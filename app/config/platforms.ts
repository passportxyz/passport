import { PLATFORM_ID } from "@gitcoin/passport-types";

export type PlatformSpec = {
  icon?: string | undefined;
  platform: PLATFORM_ID;
  name: string;
  description: string;
  connectMessage: string;
};

export const getPlatformSpec = (platformName: string): PlatformSpec | undefined => {
  let platformspec: PlatformSpec | undefined = undefined;
  PLATFORMS.forEach((platform) => {
    if (platform.platform === platformName) {
      platformspec = platform;
    }
  });
  return platformspec;
};

export const PLATFORMS: PlatformSpec[] = [
  {
    icon: "./assets/gitcoinStampIcon.svg",
    platform: "Gitcoin",
    name: "Gitcoin Grants",
    description: "Connect with Github to verify with your Gitcoin account.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/gtcPossessionStampIcon.svg",
    platform: "GTC",
    name: "GTC",
    description: "GTC possession verification",
    connectMessage: "Verify Account",
  },
  {
    icon: "./assets/gtcStakingLogoIcon.svg",
    platform: "GtcStaking",
    name: "GTC Staking",
    description: "Connect to passport to verify your staking amount.",
    connectMessage: "Verify amount",
  },
  {
    icon: "./assets/twitterStampIcon.svg",
    platform: "Twitter",
    name: "Twitter",
    description: "Connect your existing Twitter account to verify.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/googleStampIcon.svg",
    platform: "Google",
    name: "Google",
    description: "Connect your existing Google Account to verify",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/githubStampIcon.svg",
    platform: "Github",
    name: "Github",
    description: "Connect your existing Github account to verify.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/facebookStampIcon.svg",
    platform: "Facebook",
    name: "Facebook",
    description: "Connect your existing account to verify with Facebook.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/ensStampIcon.svg",
    platform: "Ens",
    name: "ENS",
    description: "Purchase an .eth name to verify/ connect your existing account.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/poapStampIcon.svg",
    platform: "POAP",
    name: "POAP",
    description: "Connect an account to a POAP owned for over 15 days.",
    connectMessage: "Connect to POAP",
  },
  {
    icon: "./assets/brightidStampIcon.svg",
    platform: "Brightid",
    name: "BrightID",
    description: "Connect your BrightID",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/pohStampIcon.svg",
    platform: "Poh",
    name: "Proof of Humanity",
    description: "Connect your wallet to start the process of verifying with Proof of Humanity.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/discordStampIcon.svg",
    platform: "Discord",
    name: "Discord",
    description: "Connect your existing Linkedin account to verify.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/linkedinStampIcon.svg",
    platform: "Linkedin",
    name: "Linkedin",
    description: "Connect your existing Linkedin account to verify.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/ethereumStampIcon.svg",
    platform: "ETH",
    name: "ETH",
    description: "ETH possession and transaction verification",
    connectMessage: "Verify Account",
  },
  // {
  //   icon: "./assets/ethStampIcon.svg",
  //   platform: "Signer",
  //   name: "Ethereum Account",
  //   description: "Additional Ethereum account",
  //   connectMessage: "Connect Account",
  // },
  {
    icon: "./assets/snapshotStampIcon.svg",
    platform: "Snapshot",
    name: "Snapshot",
    description: "Connect your existing account to verify with Snapshot.",
    connectMessage: "Verify Account",
  },
  {
    icon: "./assets/gitPOAPStampIcon.svg",
    platform: "GitPOAP",
    name: "GitPOAP",
    description: "GitPOAP Verification",
    connectMessage: "Connect Account",
  },
];
