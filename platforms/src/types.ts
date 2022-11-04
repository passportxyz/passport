/* eslint-disable */
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

export type PlatformSpec = {
  icon?: string | undefined;
  platform: PLATFORM_ID;
  name: string;
  description: string;
  connectMessage: string;
  isEVM?: boolean;
};

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

// IAM Types

// All Identity Providers should implement Provider
export interface Provider {
  type: string;
  verify: (payload: RequestPayload, context?: ProviderContext) => Promise<VerifiedPayload>;
}

// Use unknown
export type ProviderOptions = Record<string, unknown>;

export type Proofs = { [k: string]: string };

export type CallbackParameters = {
  proofs?: Proofs;
  authenticated: boolean;
};

export type AccessTokenResult = {
  proofs?: Proofs;
  authenticated: boolean;
};

export enum AuthType {
  Token,
  Window,
  Null,
}

export interface Platform {
  platformId: string;
  path?: string;
  authType?: AuthType;
  getOAuthUrl?(state: string): Promise<string>;
  getProviderProof?(): Promise<AccessTokenResult>;
}

export type PlatformOptions = Record<string, unknown>;

export type PLATFORM_ID =
  | "Google"
  | "Ens"
  | "Poh"
  | "Twitter"
  | "POAP"
  | "Facebook"
  | "Brightid"
  | "Github"
  | "Gitcoin"
  | "Linkedin"
  | "Discord"
  | "GitPOAP"
  | "Signer"
  | "Snapshot"
  | "ETH"
  | "GTC"
  | "GtcStaking"
  | "NFT"
  | "ZkSync"
  | "Lens"
  | "GnosisSafe";

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
