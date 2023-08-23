/* eslint-disable */
import axios from "axios";
import { verifyTypes } from "../";
import { RequestPayload } from "@gitcoin/passport-types";
import { stakingSubgraph } from "@gitcoin/passport-platforms/src/GtcStaking/Providers/GtcStaking";
import { BigNumber } from "ethers";
import { error } from "console";

// are idena and civic EVM platforms--they don't have isEVM = true

const SCORER_ID = process.env.ALLO_SCORER_ID || "";
const API_KEY = process.env.SCORER_API_KEY || "";

type UserStakes = {
  selfStake: BigNumber;
  communityStake: BigNumber;
};

const GITCOIN_PASSPORT_WEIGHTS = {
  "Brightid": "0.689",
  "CivicCaptchaPass": "1",
  "CivicLivenessPass": "2.25",
  "CivicUniquenessPass": "2.25",
  "CommunityStakingBronze": "1.27",
  "CommunityStakingGold": "1.27",
  "CommunityStakingSilver": "1.27",
  "Ens": "2.2",
  "EthGasProvider": "2.4",
  "EthGTEOneTxnProvider": "1.27",
  "ethPossessionsGte#1": "1.79",
  "ethPossessionsGte#10": "1.27",
  "ethPossessionsGte#32": "1.27",
  "FirstEthTxnProvider": "1.16",
  "GitcoinContributorStatistics#numGr14ContributionsGte#1": "1.41",
  "GitcoinContributorStatistics#numGrantsContributeToGte#1": "1.57",
  "GitcoinContributorStatistics#numGrantsContributeToGte#10": "2.30",
  "GitcoinContributorStatistics#numGrantsContributeToGte#100": "0.52",
  "GitcoinContributorStatistics#numGrantsContributeToGte#25": "1.48",
  "GitcoinContributorStatistics#numRoundsContributedToGte#1": "1.57",
  "GitcoinContributorStatistics#totalContributionAmountGte#10": "1.53",
  "GitcoinContributorStatistics#totalContributionAmountGte#100": "1.37",
  "GitcoinContributorStatistics#totalContributionAmountGte#1000": "1.18",
  "GnosisSafe": "2.65",
  "GuildAdmin": "0.689",
  "GuildMember": "0.689",
  "GuildPassportMember": "0.689",
  "HolonymGovIdProvider": "4",
  "Hypercerts": "0.689",
  "IdenaAge#10": "1.48",
  "IdenaAge#5": "1.48",
  "IdenaStake#100k": "1.41",
  "IdenaStake#10k": "1.16",
  "IdenaStake#1k": "0.9",
  "IdenaState#Human": "1.61",
  "IdenaState#Newbie": "0.51",
  "IdenaState#Verified": "1.35",
  "Lens": "2.45",
  "NFT": "0.69",
  "PHIActivityGold": "1.16",
  "PHIActivitySilver": "1.67",
  "Poh": "1.21",
  "SelfStakingBronze": "1.21",
  "SelfStakingGold": "1.21",
  "SelfStakingSilver": "1.21",
  "SnapshotProposalsProvider": "2.82",
  "SnapshotVotesProvider": "1.41",
  "ZkSync": "0.400",
  "ZkSyncEra": "0.400",
  "CyberProfilePremium": "1.21",
  "CyberProfilePaid": "1.21",
  "CyberProfileOrgMember": "1.21",
  "GrantsStack3Projects": "1.07",
  "GrantsStack5Projects": "1.07",
  "GrantsStack7Projects": "1.07",
  "GrantsStack2Programs": "1.07",
  "GrantsStack4Programs": "1.07",
  "GrantsStack6Programs": "1.07",
  "TrustaLabs": "1.54",
}

const TYPE = [
  "Ens",
  "Poh",
  "Brightid",
  "Gitcoin",
  "Signer",
  "Snapshot",
  "ETH",
  "GtcStaking",
  "NFT",
  "ZkSync",
  "Lens",
  "GnosisSafe",
  "GuildXYZ",
  "Hypercerts",
  "PHI",
  "Holonym",
  "Civic",
  "CyberConnect",
  "GrantsStack",
  "TrustaLabs"
]

const PROVIDER_ID = [
  "Signer",
  "Ens",
  "Poh",
  "Brightid",
  "GitcoinContributorStatistics#numGrantsContributeToGte#1",
  "GitcoinContributorStatistics#numGrantsContributeToGte#10",
  "GitcoinContributorStatistics#numGrantsContributeToGte#25",
  "GitcoinContributorStatistics#numGrantsContributeToGte#100",
  "GitcoinContributorStatistics#totalContributionAmountGte#10",
  "GitcoinContributorStatistics#totalContributionAmountGte#100",
  "GitcoinContributorStatistics#totalContributionAmountGte#1000",
  "GitcoinContributorStatistics#numRoundsContributedToGte#1",
  "GitcoinContributorStatistics#numGr14ContributionsGte#1",
  "Snapshot",
  "SnapshotProposalsProvider",
  "SnapshotVotesProvider",
  "ethPossessionsGte#1",
  "ethPossessionsGte#10",
  "ethPossessionsGte#32",
  "FirstEthTxnProvider",
  "EthGTEOneTxnProvider",
  "EthGasProvider",
  "SelfStakingBronze",
  "SelfStakingSilver",
  "SelfStakingGold",
  "CommunityStakingBronze",
  "CommunityStakingSilver",
  "CommunityStakingGold",
  "NFT",
  "ZkSync",
  "ZkSyncEra",
  "Lens",
  "GnosisSafe",
  "GuildMember",
  "GuildAdmin",
  "GuildPassportMember",
  "Hypercerts",
  "CyberProfilePremium",
  "CyberProfilePaid",
  "CyberProfileOrgMember",
  "PHIActivitySilver",
  "PHIActivityGold",
  "HolonymGovIdProvider",
  "CivicCaptchaPass",
  "CivicUniquenessPass",
  "CivicLivenessPass",
  "GrantsStack3Projects",
  "GrantsStack5Projects",
  "GrantsStack7Projects",
  "GrantsStack2Programs",
  "GrantsStack4Programs",
  "GrantsStack6Programs",
  "TrustaLabs"
]
// First check if the address is already in scorer --> isAddressInRegistry()
// -- if yes
// ---- return ScorerType
// REGARDLESS of whether or not an address is in the scorer db --->
// ---- check GTC staked --> getStake()
// ---- check if address qualifies for Web3 stamp data points --> check()
// ------ if qualifies
// -------- score web3 stamps
// ------ else
// -------- give score of 0

const GET_PASSPORT_ENDPOINT = process.env.SCORER_ENDPOINT + "/registry/stamps/";

const SCORE_PASSPORT_ENDPOINT = process.env.SCORER_ENDPOINT + "/registry/submit-passport";

function getStakeQuery(address: string): string {
  return `
  {
    users(where: {address: "${address}"}) {
      stakes {
        stake
      }
      xstakeAggregates(where: {total_gt: 0}) {
        total
      }
    }
  }
  `;
}

const check = (payload: RequestPayload): void => {
  // types filters out the types into an individual type
  const types = (payload.types?.length ? payload.types : [payload.type]).filter((type) => type);

  // verifyTypes returns whether the type is valid
  verifyTypes(types, payload)
    .then((results) => {
      const responses = results.map(({ verifyResult, type, error, code }) => ({
        valid: verifyResult.valid,
        type,
        error,
        code,
      }));
    })
    .catch(() => "something went wrong");
};

interface Output {
  ScoreType: string;
  Score: number;
  GTC_Staked: number;
  AdditionalCriteria?: any;
}

async function isAddressInRegistry(address: string): Promise<boolean> {
  const response = await axios.get(`${GET_PASSPORT_ENDPOINT}${address}?limit=10`)
  const addressInRegistry = response.data.items.length > 0 ? true : false;
  return addressInRegistry;
}

async function checkGTCStaked(address: string): Promise<UserStakes> {
  const addressLower = address.toLowerCase();
  const response = await axios.post(stakingSubgraph, {
    query: getStakeQuery(addressLower),
  });

  const selfStake = BigNumber.from(response?.data?.data?.users[0]?.stakes[0]?.stake || "0");
  const communityStake = BigNumber.from(response?.data?.data?.users[0]?.xstakeAggregates[0]?.total || "0");
  const userStakes = { selfStake, communityStake }
  return userStakes;
}

async function qualifiesForWeb3Stamp(address: string): Promise<boolean> {
  // TODO: Check if address qualifies for web3 stamp data points.
  try {
    return false;
  } catch (e) {
    console.error(e)
  }
}

async function scorePassport(address: any): Promise<number> {
  const options = {
    data: {
      address: address,
      scorer_id: SCORER_ID,
    },
    headers: {
      "X-API-Key": API_KEY,
      "Content-Type": "application/json",
    }
  }
  try {
    // if isAddressInRegistry() === true, score with endpoint
    const response = axios.post(SCORE_PASSPORT_ENDPOINT, options)
    return 42;
  } catch (e) {
    console.error(e);
  }
}

async function scoreWeb3Stamps(address: string): Promise<number> {
  const scores = [];
  // Score based on web3 stamps for the given address using calculation
  // and web3 stamp weights
  // if {type: check.data.valid === true}
  // --> add score to scores array
  // reduce the scores array and return the number
  return 42;
}

// Promise<Output>
/**
 * Output:
 * ScoreType: Distinguishing between Passport and web3.
 * Score: The actual numerical score.
 * GTC Staked: Amount of GTC staked by the user.
 * Additional Criteria: Any other pertinent data we deem necessary.
 */
async function main(address: string): Promise<void> {
  let output: Output;

  if (await isAddressInRegistry(address)) {
      const score = await scorePassport(address);
      const gtcStaked = await checkGTCStaked(address);

      // output = {
      //     ScoreType: 'Passport',
      //     Score: score,
      //     GTC_Staked: gtcStaked,
      //     AdditionalCriteria: {}
      // };

  // } else {
  //     if (await qualifiesForWeb3Stamp(address)) {
  //         const score = await scoreWeb3Stamps(address);
  //         const gtcStaked = await checkGTCStaked(address);

  //         output = {
  //             ScoreType: 'Web3',
  //             Score: score,
  //             GTC_Staked: gtcStaked,
  //             AdditionalCriteria: {}
  //         };
  //     } else {
  //         output = {
  //             ScoreType: 'Web3',
  //             Score: 0,
  //             GTC_Staked: gtcStaked,
  //             AdditionalCriteria: {}
  //         };
  //     }
  }

  // return output;
}

main("someAddress").then(console.log);
