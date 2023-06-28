import { utils } from "ethers";
import {
  NO_EXPIRATION,
  SchemaEncoder,
  ZERO_BYTES32,
  MultiAttestationRequest,
  AttestationRequestData,
} from "@ethereum-attestation-service/eas-sdk";
import { VerifiableCredential } from "@gitcoin/passport-types";
import { BigNumber } from "@ethersproject/bignumber";

import { fetchPassportScore } from "./scorerService";
import { encodeEasScore } from "./easStampSchema";

type PassportAttestationStamp = {
  name: string;
  index: number;
  bit: number;
};

const passportAttestationStampMap: Map<string, PassportAttestationStamp> = new Map();

function addStamp(stampInfo: PassportAttestationStamp) {
  passportAttestationStampMap.set(stampInfo.name, stampInfo);
}

addStamp({ bit: 0, index: 0, name: "gtcPossessionsGte#10" });
addStamp({ bit: 1, index: 0, name: "gtcPossessionsGte#100" });
addStamp({ bit: 2, index: 0, name: "SelfStakingBronze" });
addStamp({ bit: 3, index: 0, name: "SelfStakingSilver" });
addStamp({ bit: 4, index: 0, name: "SelfStakingGold" });
addStamp({ bit: 5, index: 0, name: "CommunityStakingBronze" });
addStamp({ bit: 6, index: 0, name: "CommunityStakingSilver" });
addStamp({ bit: 7, index: 0, name: "CommunityStakingGold" });
addStamp({ bit: 8, index: 0, name: "GitcoinContributorStatistics#numGrantsContributeToGte#1" });
addStamp({ bit: 9, index: 0, name: "GitcoinContributorStatistics#numGrantsContributeToGte#10" });
addStamp({ bit: 10, index: 0, name: "GitcoinContributorStatistics#numGrantsContributeToGte#25" });
addStamp({ bit: 11, index: 0, name: "GitcoinContributorStatistics#numGrantsContributeToGte#100" });
addStamp({ bit: 12, index: 0, name: "GitcoinContributorStatistics#totalContributionAmountGte#10" });
addStamp({ bit: 13, index: 0, name: "GitcoinContributorStatistics#totalContributionAmountGte#100" });
addStamp({ bit: 14, index: 0, name: "GitcoinContributorStatistics#totalContributionAmountGte#1000" });
addStamp({ bit: 15, index: 0, name: "GitcoinContributorStatistics#numGr14ContributionsGte#1" });
addStamp({ bit: 16, index: 0, name: "GitcoinContributorStatistics#numRoundsContributedToGte#1" });
addStamp({ bit: 17, index: 0, name: "GitcoinGranteeStatistics#numOwnedGrants#1" });
addStamp({ bit: 18, index: 0, name: "GitcoinGranteeStatistics#numGrantContributors#10" });
addStamp({ bit: 19, index: 0, name: "GitcoinGranteeStatistics#numGrantContributors#25" });
addStamp({ bit: 20, index: 0, name: "GitcoinGranteeStatistics#numGrantContributors#100" });
addStamp({ bit: 21, index: 0, name: "GitcoinGranteeStatistics#totalContributionAmount#100" });
addStamp({ bit: 22, index: 0, name: "GitcoinGranteeStatistics#totalContributionAmount#1000" });
addStamp({ bit: 23, index: 0, name: "GitcoinGranteeStatistics#totalContributionAmount#10000" });
addStamp({ bit: 24, index: 0, name: "GitcoinGranteeStatistics#numGrantsInEcoAndCauseRound#1" });
addStamp({ bit: 25, index: 0, name: "Twitter" });
addStamp({ bit: 26, index: 0, name: "TwitterTweetGT10" });
addStamp({ bit: 27, index: 0, name: "TwitterFollowerGT100" });
addStamp({ bit: 28, index: 0, name: "TwitterFollowerGT500" });
addStamp({ bit: 29, index: 0, name: "TwitterFollowerGTE1000" });
addStamp({ bit: 30, index: 0, name: "TwitterFollowerGT5000" });
addStamp({ bit: 31, index: 0, name: "Discord" });
addStamp({ bit: 32, index: 0, name: "Google" });
addStamp({ bit: 33, index: 0, name: "Github" });
addStamp({ bit: 34, index: 0, name: "FiveOrMoreGithubRepos" });
addStamp({ bit: 35, index: 0, name: "ForkedGithubRepoProvider" });
addStamp({ bit: 36, index: 0, name: "StarredGithubRepoProvider" });
addStamp({ bit: 37, index: 0, name: "TenOrMoreGithubFollowers" });
addStamp({ bit: 38, index: 0, name: "FiftyOrMoreGithubFollowers" });
addStamp({ bit: 39, index: 0, name: "Facebook" });
addStamp({ bit: 40, index: 0, name: "FacebookProfilePicture" });
addStamp({ bit: 41, index: 0, name: "Linkedin" });
addStamp({ bit: 42, index: 0, name: "Ens" });
addStamp({ bit: 43, index: 0, name: "POAP" });
addStamp({ bit: 44, index: 0, name: "Brightid" });
addStamp({ bit: 45, index: 0, name: "Poh" });
addStamp({ bit: 46, index: 0, name: "ethPossessionsGte#1" });
addStamp({ bit: 47, index: 0, name: "ethPossessionsGte#10" });
addStamp({ bit: 48, index: 0, name: "ethPossessionsGte#32" });
addStamp({ bit: 49, index: 0, name: "FirstEthTxnProvider" });
addStamp({ bit: 50, index: 0, name: "EthGTEOneTxnProvider" });
addStamp({ bit: 51, index: 0, name: "EthGasProvider" });
addStamp({ bit: 52, index: 0, name: "SnapshotVotesProvider" });
addStamp({ bit: 53, index: 0, name: "SnapshotProposalsProvider" });
addStamp({ bit: 54, index: 0, name: "GitPOAP" });
addStamp({ bit: 55, index: 0, name: "NFT" });
addStamp({ bit: 56, index: 0, name: "ZkSync" });
addStamp({ bit: 57, index: 0, name: "ZkSyncEra" });
addStamp({ bit: 58, index: 0, name: "Lens" });
addStamp({ bit: 59, index: 0, name: "GnosisSafe" });
addStamp({ bit: 60, index: 0, name: "Coinbase" });
addStamp({ bit: 61, index: 0, name: "GuildMember" });
addStamp({ bit: 62, index: 0, name: "GuildAdmin" });
addStamp({ bit: 63, index: 0, name: "GuildPassportMember" });
addStamp({ bit: 64, index: 0, name: "Hypercerts" });
addStamp({ bit: 65, index: 0, name: "PHIActivitySilver" });
addStamp({ bit: 66, index: 0, name: "PHIActivityGold" });
addStamp({ bit: 67, index: 0, name: "HolonymGovIdProvider" });
addStamp({ bit: 68, index: 0, name: "IdenaState#Newbie" });
addStamp({ bit: 69, index: 0, name: "IdenaState#Verified" });
addStamp({ bit: 70, index: 0, name: "IdenaState#Human" });
addStamp({ bit: 71, index: 0, name: "IdenaStake#1k" });
addStamp({ bit: 72, index: 0, name: "IdenaStake#10k" });
addStamp({ bit: 73, index: 0, name: "IdenaStake#100k" });
addStamp({ bit: 74, index: 0, name: "IdenaAge#5" });
addStamp({ bit: 75, index: 0, name: "IdenaAge#10" });

export const encodeEasPassport = (credentials: VerifiableCredential[]): string => {
  const attestation = credentials.reduce(
    (acc, credential) => {
      const stampInfo: PassportAttestationStamp = passportAttestationStampMap.get(
        credential.credentialSubject.provider
      );
      if (stampInfo) {
        const index = stampInfo.index;
        if (acc.providers.length <= index) {
          // We must add another element to the array of providers
          acc.providers.length = index + 1;
          acc.providers[index] = BigNumber.from(0);
        }
        acc.providers[index] = acc.providers[index].and(BigNumber.from(0).shl(stampInfo.bit));
        // We decode the original 256-bit hash value from the credential
        const hashValue = "0x" + Buffer.from(credential.credentialSubject.hash.split(":")[1], "base64").toString("hex");
        // Get the unix timestamp, the number of milliseconds since January 1, 1970, UTC
        const issuanceDate = Math.floor(new Date(credential.issuanceDate).getTime() / 1000);
        acc.info.push({
          hash: hashValue,
          issuanceDate: BigNumber.from(issuanceDate),
          stampInfo: stampInfo,
        });
      }
      return acc;
    },
    {
      providers: [],
      info: [],
      //   hashes: [],
      //   issuancesDates: [],
      //   // We will use the ordering information to sort the hashes and issuancesDates arrays by the index and then bit
      //   ordering: [],
    }
  );

  attestation.info = attestation.info.sort((a, b) => {
    // We want to order forst by index position and then by bit order
    const indexCompare = a.stampInfo.index - b.stampInfo.index;
    if (indexCompare === 0) {
      return a.stampInfo.bit - b.stampInfo.bit;
    }
    return indexCompare;
  });

  const providers = attestation.providers;
  const hashes = attestation.info.map((info) => info.hash);
  const issuancesDates = attestation.info.map((info) => info.issuanceDate);

  const attestationSchemaEncoder = new SchemaEncoder("uint256[] providers, bytes32[] hashes, uint64[] issuanceDates");

  const encodedData = attestationSchemaEncoder.encodeData([
    { name: "providers", value: providers, type: "uint256[]" },
    { name: "hashes", value: hashes, type: "bytes32[]" },
    { name: "issuanceDates", value: issuancesDates, type: "uint64[]" },
  ]);

  return encodedData;
};

type ValidatedCredential = {
  credential: VerifiableCredential;
  verified: boolean;
};

export const formatMultiAttestationRequest = async (
  credentials: ValidatedCredential[],
  recipient: string
): Promise<MultiAttestationRequest[]> => {
  const defaultRequestData = {
    recipient,
    expirationTime: NO_EXPIRATION,
    revocable: true,
    refUID: ZERO_BYTES32,
    value: 0,
  };

  const stampRequestData: AttestationRequestData[] = [
    {
      ...defaultRequestData,
      data: encodeEasPassport(
        credentials
          .filter(({ verified }) => verified)
          .map(({ credential }) => {
            return credential;
          })
      ),
    },
  ];

  const scoreRequestData: AttestationRequestData[] = [
    {
      ...defaultRequestData,
      data: encodeEasScore(await fetchPassportScore(recipient)),
    },
  ];

  return [
    {
      schema: process.env.EAS_GITCOIN_PASSPORT_SCHEMA,
      data: stampRequestData,
    },
    {
      schema: process.env.EAS_GITCOIN_SCORE_SCHEMA,
      data: scoreRequestData,
    },
  ];
};
