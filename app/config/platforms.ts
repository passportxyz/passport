import { PLATFORM_ID } from "@gitcoin/passport-types";

export type PlatformSpec = {
  icon?: string | undefined;
  platform: PLATFORM_ID;
  name: string;
  description: string;
  connectMessage: string;
  isEVM?: boolean;
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
    icon: "./assets/gtcPossessionStampIcon.svg",
    platform: "GTC",
    name: "GTC",
    description: "Connect your wallet to confirm GTC possession",
    connectMessage: "Verify Ownership",
    isEVM: true,
  },
  {
    icon: "./assets/gtcStakingLogoIcon.svg",
    platform: "GtcStaking",
    name: "GTC Staking",
    description: "Connect your wallet to verify your staked amount. This accesses your Passport data.",
    connectMessage: "Verify Account",
    isEVM: true,
  },
  {
    icon: "./assets/gtcGrantsLightIcon.svg",
    platform: "Gitcoin",
    name: "Gitcoin Grants",
    description: "Connect your wallet to review your donation activity on Gitcoin (Up to GR15).",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/twitterStampIcon.svg",
    platform: "Twitter",
    name: "Twitter",
    description: "Connect your Twitter account to verify stamp details.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/discordStampIcon.svg",
    platform: "Discord",
    name: "Discord",
    description: "Connect your Discord account to verify stamp details.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/googleStampIcon.svg",
    platform: "Google",
    name: "Google",
    description: "Connect your Google Account to verify stamp details.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/githubWhiteStampIcon.svg",
    platform: "Github",
    name: "Github",
    description: "Connect your Github account to verify stamp details.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/facebookStampIcon.svg",
    platform: "Facebook",
    name: "Facebook",
    description: "Connect your Facebook account to verify stamp details.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/linkedinStampIcon.svg",
    platform: "Linkedin",
    name: "Linkedin",
    description: "Connect your LinkedIn account to verify stamp details.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/ensStampIcon.svg",
    platform: "Ens",
    name: "ENS",
    description: "Verify your ENS account. If you do not have one, you can purchase one.",
    connectMessage: "Verify Ownership",
    isEVM: true,
  },
  {
    icon: "./assets/poapStampIcon.svg",
    platform: "POAP",
    name: "POAP",
    description: "Verify POAP ownership (POAP must be atleast 15 days old).",
    connectMessage: "Verify Ownership",
    isEVM: true,
  },
  {
    icon: "./assets/brightidStampIcon.svg",
    platform: "Brightid",
    name: "BrightID",
    description:
      "Verify your BrightID connection details. If you do not have BrightID, you can join a connection party.",
    connectMessage: "Verify Account",
    isEVM: true,
  },
  {
    icon: "./assets/pohStampIcon.svg",
    platform: "Poh",
    name: "Proof of Humanity",
    description: "Verify you have a Proof of Humanity profile.",
    connectMessage: "Verify Account",
    isEVM: true,
  },
  {
    icon: "./assets/ethereumStampIcon.svg",
    platform: "ETH",
    name: "ETH",
    description: "Connect your account to verify ETH possession and transaction volume.",
    connectMessage: "Verify Account",
    isEVM: true,
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
    description: "Connect your account to verify Snapshot stamp details.",
    connectMessage: "Verify Account",
    isEVM: true,
  },
  {
    icon: "./assets/gitPOAPStampIcon.svg",
    platform: "GitPOAP",
    name: "GitPOAP",
    description: "Connect your account to verify GitPOAP Verification.",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/nftStampIcon.svg",
    platform: "NFT",
    name: "NFT Holder",
    description: "Connect your wallet and confirm you own an NFT.",
    connectMessage: "Confirm Ownership",
  },
  {
    icon: "./assets/zksyncStampIcon.svg",
    platform: "ZkSync",
    name: "ZkSync",
    description: "Connect your wallet to verify ZkSync transactions.",
    connectMessage: "Connect Wallet",
    isEVM: true,
  },
  {
    icon: "./assets/lensWhiteStampIcon.svg",
    platform: "Lens",
    name: "Lens",
    description: "Connect your wallet to verify ownership of a Lens Profile.",
    connectMessage: "Connect Walllet",
    isEVM: true,
  },
  {
    icon: "./assets/gnosisSafeStampIcon.svg",
    platform: "GnosisSafe",
    name: "Gnosis Safe",
    description: "Connect your wallet to verify Gnosis Safe Signer/Owner Verification",
    connectMessage: "Connect Wallet",
  },
  {
    icon: "./assets/coinbaseStampIcon.svg",
    platform: "Coinbase",
    name: "Coinbase",
    description: "Connect your Coinbase account to verify stamp details.",
    connectMessage: "Connect Account",
    isEVM: false,
  },
  {
    icon: "./assets/guildXYZStampIcon.svg",
    platform: "GuildXYZ",
    name: "Guild Membership and Roles",
    description: "Connect your Guild XYZ account to verify your memberships.",
    connectMessage: "Verify Guilds",
    isEVM: true,
  },
  {
    icon: "./assets/idenaStampIcon.svg",
    platform: "Idena",
    name: "Idena",
    description: "Idena Verification",
    connectMessage: "Verify Identity",
  },
];
