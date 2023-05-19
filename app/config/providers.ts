import { PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-types";

export type ProviderSpec = {
  title: string;
  name: PROVIDER_ID;
  icon?: string;
  description?: string;
};

export type PlatformGroupSpec = {
  providers: ProviderSpec[];
  platformGroup: string;
};

export type UpdatedPlatforms = {
  [key: string]: boolean;
};

// Platform -> Provider[]
export type Providers = {
  [platform in PLATFORM_ID]: PlatformGroupSpec[];
};

export const STAMP_PROVIDERS: Readonly<Providers> = {
  Google: [{ platformGroup: "Account Name", providers: [{ title: "Google", name: "Google" }] }],
  Ens: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Ens" }],
    },
  ],
  Poh: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Poh" }],
    },
  ],
  Twitter: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Twitter" }],
    },
    {
      platformGroup: "Tweet/Posts",
      providers: [{ title: "More than 10", name: "TwitterTweetGT10" }],
    },
    {
      platformGroup: "Followers",
      providers: [
        { title: "More than 100", name: "TwitterFollowerGT100" },
        {
          title: "More than 500",
          name: "TwitterFollowerGT500",
        },
        {
          title: "More than 1000",
          name: "TwitterFollowerGTE1000",
        },
        {
          title: "More than 5000",
          name: "TwitterFollowerGT5000",
        },
      ],
    },
  ],
  POAP: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Connect an account to a PoAP owned for over 15 days.", name: "POAP" }],
    },
  ],
  Facebook: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Facebook" }],
    },
    {
      platformGroup: "Friends",
      providers: [{ title: "Greater than 100", name: "FacebookFriends" }],
    },
    {
      platformGroup: "Profile",
      providers: [{ title: "Profile Picture attached", name: "FacebookProfilePicture" }],
    },
  ],
  Brightid: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Brightid" }],
    },
  ],
  Github: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Github" }],
    },
    {
      platformGroup: "Repositories",
      providers: [
        {
          title: "Five or more Github repos",
          name: "FiveOrMoreGithubRepos",
        },
        {
          title: "At least 1 Github repo forked by another user",
          name: "ForkedGithubRepoProvider",
        },
        {
          title: "At least 1 Github repo starred by another user",
          name: "StarredGithubRepoProvider",
        },
      ],
    },
    {
      platformGroup: "Followers",
      providers: [
        {
          title: "Ten or more Github followers",
          name: "TenOrMoreGithubFollowers",
        },
        {
          title: "Fifty or more Github followers",
          name: "FiftyOrMoreGithubFollowers",
        },
      ],
    },
  ],
  Gitcoin: [
    {
      platformGroup: "Contributed to...",
      providers: [
        { title: "more than 1 Grant", name: "GitcoinContributorStatistics#numGrantsContributeToGte#1" },
        { title: "more than 10 Grants", name: "GitcoinContributorStatistics#numGrantsContributeToGte#10" },
        { title: "more than 25 Grants", name: "GitcoinContributorStatistics#numGrantsContributeToGte#25" },
        { title: "more than 100 Grants", name: "GitcoinContributorStatistics#numGrantsContributeToGte#100" },
      ],
    },
    {
      platformGroup: "Contributed ($)...",
      providers: [
        { title: "more than $10", name: "GitcoinContributorStatistics#totalContributionAmountGte#10" },
        { title: "more than $100", name: "GitcoinContributorStatistics#totalContributionAmountGte#100" },
        { title: "more than $1000", name: "GitcoinContributorStatistics#totalContributionAmountGte#1000" },
      ],
    },
    {
      platformGroup: "Contributed in...",
      providers: [
        { title: "GR14", name: "GitcoinContributorStatistics#numGr14ContributionsGte#1" },
        { title: "more than 1 Round", name: "GitcoinContributorStatistics#numRoundsContributedToGte#1" },
      ],
    },
    {
      platformGroup: "Owner of...",
      providers: [{ title: " more than 1 Grant", name: "GitcoinGranteeStatistics#numOwnedGrants#1" }],
    },
    {
      platformGroup: "Grants have more than...",
      providers: [
        { title: "10 Contributors", name: "GitcoinGranteeStatistics#numGrantContributors#10" },
        { title: "25 Contributors", name: "GitcoinGranteeStatistics#numGrantContributors#25" },
        { title: "100 Contributors", name: "GitcoinGranteeStatistics#numGrantContributors#100" },
      ],
    },
    {
      platformGroup: "Grants have received...",
      providers: [
        { title: "more than $100", name: "GitcoinGranteeStatistics#totalContributionAmount#100" },
        { title: "more than $1000", name: "GitcoinGranteeStatistics#totalContributionAmount#1000" },
        { title: "more than $10000", name: "GitcoinGranteeStatistics#totalContributionAmount#10000" },
      ],
    },
    {
      platformGroup: "Eco/Cause Rounds",
      providers: [
        {
          title: "owner of more than 1 Grant in Eco/Cause Rounds",
          name: "GitcoinGranteeStatistics#numGrantsInEcoAndCauseRound#1",
        },
      ],
    },
  ],
  Linkedin: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Linkedin" }],
    },
  ],
  Discord: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Discord" }],
    },
  ],
  Signer: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Signer" }],
    },
  ],
  GitPOAP: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "GitPOAP" }],
    },
  ],
  Snapshot: [
    {
      platformGroup: "Snapshot Voter",
      providers: [{ title: "Voted on 2 or more DAO proposals", name: "SnapshotVotesProvider" }],
    },
    {
      platformGroup: "Snapshot Proposal Creator",
      providers: [
        { title: "Created a DAO proposal that was voted on by at least 1 account", name: "SnapshotProposalsProvider" },
      ],
    },
  ],
  ETH: [
    {
      platformGroup: "Possessions",
      providers: [
        { title: "At least 1 ETH", name: "ethPossessionsGte#1" },
        { title: "At least 10 ETH", name: "ethPossessionsGte#10" },
        { title: "At least 32 ETH", name: "ethPossessionsGte#32" },
      ],
    },
    {
      platformGroup: "Transactions",
      providers: [
        { title: "First ETH transaction occurred more than 30 days ago", name: "FirstEthTxnProvider" },
        { title: "At least 1 ETH transaction", name: "EthGTEOneTxnProvider" },
      ],
    },
    {
      platformGroup: "Gas fees spent",
      providers: [{ title: "At least 0.5 ETH in gas fees spent", name: "EthGasProvider" }],
    },
  ],
  GTC: [
    {
      platformGroup: "GTC possessions",
      providers: [
        { title: "At least 10 GTC", name: "gtcPossessionsGte#10" },
        { title: "At least 100 GTC", name: "gtcPossessionsGte#100" },
      ],
    },
  ],
  GtcStaking: [
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
  ],
  NFT: [
    {
      platformGroup: "NFT Holder",
      providers: [{ title: "Holds at least 1 NFT", name: "NFT" }],
    },
  ],
  ZkSync: [
    {
      platformGroup: "Account name",
      providers: [{ title: "Encrypted", name: "ZkSync" }],
    },
  ],
  Lens: [
    {
      platformGroup: "Lens Handle",
      providers: [{ title: "At least 1 Lens Handle", name: "Lens" }],
    },
  ],
  GnosisSafe: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "GnosisSafe" }],
    },
  ],
  Coinbase: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Coinbase" }],
    },
  ],
  GuildXYZ: [
    {
      platformGroup: "Guild Member",
      providers: [
        {
          title: "Member of more than 5 guilds and more than 15 roles*",
          name: "GuildMember",
        },
        {
          title: "Owner or Administrator of one or more guilds*",
          name: "GuildAdmin",
        },
        { title: "Member with 1 or more roles in Gitcoin Passport Guild", name: "GuildPassportMember" },
      ],
    },
    {
      platformGroup: "Guild Admin",
      providers: [
        {
          title: "Owner or Administrator of one or more guilds*",
          name: "GuildAdmin",
        },
      ],
    },
    {
      platformGroup: "Guild Passport Member",
      providers: [{ title: "Member with 1 or more roles in Gitcoin Passport Guild", name: "GuildPassportMember" }],
    },
  ],
  Civic: [
    {
      platformGroup: "Civic Pass",
      providers: [
        { title: "holds a Civic CAPTCHA Pass", name: "CivicCaptchaPass" },
        { title: "holds a Civic Uniqueness Pass", name: "CivicUniquenessPass" },
        { title: "holds a Civic Liveness Pass", name: "CivicLivenessPass" },
        { title: "holds a Civic IDV Pass", name: "CivicIDVPass" },
      ],
    },
  ],
};
