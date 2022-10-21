export type PLATFORM_ID = string;

// export type PROVIDER_ID = string;

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
    isEVM: true,
  },
  {
    icon: "./assets/gtcStakingLogoIcon.svg",
    platform: "GtcStaking",
    name: "GTC Staking",
    description: "Connect to passport to verify your staking amount.",
    connectMessage: "Verify amount",
    isEVM: true,
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
    isEVM: true,
  },
  {
    icon: "./assets/poapStampIcon.svg",
    platform: "POAP",
    name: "POAP",
    description: "Connect an account to a POAP owned for over 15 days.",
    connectMessage: "Connect to POAP",
    isEVM: true,
  },
  {
    icon: "./assets/brightidStampIcon.svg",
    platform: "Brightid",
    name: "BrightID",
    description: "Connect your BrightID",
    connectMessage: "Connect Account",
    isEVM: true,
  },
  {
    icon: "./assets/pohStampIcon.svg",
    platform: "Poh",
    name: "Proof of Humanity",
    description: "Connect your wallet to start the process of verifying with Proof of Humanity.",
    connectMessage: "Connect Account",
    isEVM: true,
  },
  {
    icon: "./assets/discordStampIcon.svg",
    platform: "Discord",
    name: "Discord",
    description: "Connect your existing Discord account to verify.",
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
    description: "Connect your existing account to verify with Snapshot.",
    connectMessage: "Verify Account",
    isEVM: true,
  },
  {
    icon: "./assets/gitPOAPStampIcon.svg",
    platform: "GitPOAP",
    name: "GitPOAP",
    description: "GitPOAP Verification",
    connectMessage: "Connect Account",
  },
  {
    icon: "./assets/nftStampIcon.svg",
    platform: "NFT",
    name: "NFT Holder",
    description: "Connect a wallet and validate the stamp by retrieving an NFT.",
    connectMessage: "Connect NFT",
  },
  {
    icon: "./assets/zksyncStampIcon.svg",
    platform: "ZkSync",
    name: "ZkSync",
    description: "ZkSync Verification",
    connectMessage: "Verify Account",
    isEVM: true,
  },
  {
    icon: "./assets/lensStampIcon.svg",
    platform: "Lens",
    name: "Lens",
    description: "Lens Profile Verification",
    connectMessage: "Verify Account",
    isEVM: true,
  },
  {
    icon: "./assets/gnosisSafeStampIcon.svg",
    platform: "GnosisSafe",
    name: "Gnosis Safe",
    description: "Gnosis Safe Signer/Owner Verification",
    connectMessage: "Verify Account",
  },
];

export type PROVIDER_ID =
  | "Signer"
  | "Google"
  | "Ens"
  | "Poh"
  | "Twitter"
  | "TwitterTweetGT10"
  | "TwitterFollowerGT100"
  | "TwitterFollowerGT500"
  | "TwitterFollowerGTE1000"
  | "TwitterFollowerGT5000"
  | "POAP"
  | "Facebook"
  | "FacebookFriends"
  | "FacebookProfilePicture"
  | "Brightid"
  | "Github"
  | "TenOrMoreGithubFollowers"
  | "FiftyOrMoreGithubFollowers"
  | "ForkedGithubRepoProvider"
  | "StarredGithubRepoProvider"
  | "FiveOrMoreGithubRepos"
  | "GitcoinContributorStatistics#numGrantsContributeToGte#1"
  | "GitcoinContributorStatistics#numGrantsContributeToGte#10"
  | "GitcoinContributorStatistics#numGrantsContributeToGte#25"
  | "GitcoinContributorStatistics#numGrantsContributeToGte#100"
  | "GitcoinContributorStatistics#totalContributionAmountGte#10"
  | "GitcoinContributorStatistics#totalContributionAmountGte#100"
  | "GitcoinContributorStatistics#totalContributionAmountGte#1000"
  | "GitcoinContributorStatistics#numRoundsContributedToGte#1"
  | "GitcoinContributorStatistics#numGr14ContributionsGte#1"
  | "GitcoinGranteeStatistics#numOwnedGrants#1"
  | "GitcoinGranteeStatistics#numGrantContributors#10"
  | "GitcoinGranteeStatistics#numGrantContributors#25"
  | "GitcoinGranteeStatistics#numGrantContributors#100"
  | "GitcoinGranteeStatistics#totalContributionAmount#100"
  | "GitcoinGranteeStatistics#totalContributionAmount#1000"
  | "GitcoinGranteeStatistics#totalContributionAmount#10000"
  | "GitcoinGranteeStatistics#numGrantsInEcoAndCauseRound#1"
  | "Linkedin"
  | "Discord"
  | "GitPOAP"
  | "Snapshot"
  | "SnapshotProposalsProvider"
  | "SnapshotVotesProvider"
  | "ethPossessionsGte#1"
  | "ethPossessionsGte#10"
  | "ethPossessionsGte#32"
  | "FirstEthTxnProvider"
  | "EthGTEOneTxnProvider"
  | "EthGasProvider"
  | "gtcPossessionsGte#10"
  | "gtcPossessionsGte#100"
  | "SelfStakingBronze"
  | "SelfStakingSilver"
  | "SelfStakingGold"
  | "CommunityStakingBronze"
  | "CommunityStakingSilver"
  | "CommunityStakingGold"
  | "NFT"
  | "ZkSync"
  | "Lens"
  | "GnosisSafe";
