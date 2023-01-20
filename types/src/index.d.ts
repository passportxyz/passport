import { JsonRpcSigner } from "@ethersproject/providers";
// BrightId Shared Types
export { BrightIdProcedureResponse, BrightIdVerificationResponse, BrightIdSponsorshipResponse } from "./brightid";

// Typing for required parts of DIDKit
export type DIDKitLib = {
  verifyCredential: (vc: string, proofOptions: string) => Promise<string>;
  issueCredential: (credential: string, proofOptions: string, key: string) => Promise<string>;
  keyToDID: (method_pattern: string, jwk: string) => string;
  keyToVerificationMethod: (method_pattern: string, jwk: string) => Promise<string>;
} & { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

// rough outline of a VerifiableCredential
export type VerifiableCredential = {
  "@context": string[];
  type: string[];
  credentialSubject: {
    id: string;
    "@context": { [key: string]: string }[];
    hash?: string;
    provider?: string;
    address?: string;
    challenge?: string;
  };
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  proof: {
    type: string;
    proofPurpose: string;
    verificationMethod: string;
    created: string;
    jws: string;
  };
};

// A ProviderContext is used as a temporary storage so that providers can can share data
// between them, in case multiple VCs are requests in one http request
export type ProviderContext = {
  [key: string]: unknown;
};

// values received from client and fed into the verify route
export type RequestPayload = {
  type: string;
  types?: string[];
  address: string;
  version: string;
  proofs?: {
    [k: string]: string;
  };
  signer?: {
    challenge: VerifiableCredential;
    signature: string;
    address: string;
  };
  jsonRpcSigner?: JsonRpcSigner;
  challenge?: string;
  issuer?: string;
  rpcUrl?: string;
};

// response Object return by verify procedure
export type ChallengePayload = {
  valid: boolean;
  error?: string[];
  // This will overwrite the record presented in the Payload
  record?: {
    challenge: string;
  } & { [k: string]: string };
};

// response Object return by verify procedure
export type VerifiedPayload = {
  valid: boolean;
  error?: string[];
  // This will be combined with the ProofRecord (built from the verified content in the Payload)
  record?: { [k: string]: string };
};

// these values are placed into a sha256 along with the IAM_PRIVATE_KEY to generate a deterministic but protected hash of the PII info
export type ProofRecord = {
  type: string;
  version: string;
  username?: string;
  email?: string;
  proofMsg?: string;
} & { [k: string]: string };

// IAM HTTP Request body types
export type ChallengeRequestBody = {
  payload: RequestPayload;
};
export type VerifyRequestBody = {
  challenge: VerifiableCredential;
  payload: RequestPayload;
};

// IAM HTTP Response body types
export type ValidResponseBody = {
  credential: VerifiableCredential;
  record?: ProofRecord;
};
export type ErrorResponseBody = {
  error?: string;
  code?: number;
};
export type CredentialResponseBody = ValidResponseBody & ErrorResponseBody;

// Issued Credential response
export type IssuedChallenge = {
  challenge: VerifiableCredential;
};
export type IssuedCredential = {
  credential: VerifiableCredential;
};

// Issued Credential and support matterial returned when fetching the VerifiableCredential
export type VerifiableCredentialRecord = {
  signature: string;
  challenge: VerifiableCredential;
  error?: string;
  record?: ProofRecord;
  credential?: VerifiableCredential;
  credentials?: CredentialResponseBody[];
};

export type Stamp = {
  // recordUserName: string;
  // credentialIssuer: string;
  streamId?: string; // Must not be undefined for stamps loaded from ceramic
  provider: PROVIDER_ID;
  credential: VerifiableCredential;
};

export type Passport = {
  issuanceDate: Date;
  expiryDate: Date;
  stamps: Stamp[];
};

export type PassportError = {
  error: boolean;
  passport?: boolean;
  stamps?: string[];
};

export type PassportWithErrors = {
  passport: Passport;
  errors?: PassportError;
};

// Passport DID
export type DID = string;

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
