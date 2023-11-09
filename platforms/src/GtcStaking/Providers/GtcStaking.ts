// ----- Types
import { ProviderExternalVerificationError, type Provider } from "../../types";
import type { ProviderContext, PROVIDER_ID, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";
import BigNumber from "bignumber.js";

// ----- Utils
import { buildCID } from "../../utils/createCid";

const gtcStakingEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}registry/gtc-stake`;
const apiKey = process.env.SCORER_API_KEY;

type UserStake = {
  selfStake: BigNumber;
  communityStakes: Stake[];
  error?: string;
};

export type Stake = {
  id: number;
  event_type: string;
  round_id: number;
  staker: string;
  address: string;
  amount: string;
  staked: boolean;
  block_number: number;
  tx_hash: string;
};

type CommunityStakingCounts = {
  bcs1gte5: number;
  ecs2gte10: number;
  tc5gte20: number;
};
export interface StakeResponse {
  data: {
    results: Stake[];
  };
}

export type GtcStakingContext = ProviderContext & {
  gtcStaking?: {
    userStake?: UserStake;
  };
};

export type GtcStakingProviderOptions = {
  type: PROVIDER_ID;
  threshold?: BigNumber | number;
  dataKey: keyof UserStake;
  communityTypeCount?: number | undefined;
  // Only needed for historic hashes, can be left
  // off of any new providers
  identifier?: string;
};

export class GtcStakingProvider implements Provider {
  type: PROVIDER_ID;
  threshold?: BigNumber | number;
  dataKey: keyof UserStake;
  identifier: string;
  communityTypeCount?: number | undefined;

  // construct the provider instance with supplied options
  constructor(options: GtcStakingProviderOptions) {
    this.type = options.type;
    this.threshold = options.threshold;
    this.dataKey = options.dataKey;
    this.identifier = options.identifier;
    this.communityTypeCount = options.communityTypeCount;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: GtcStakingContext): Promise<VerifiedPayload> {
    try {
      const address = payload.address.toLowerCase();
      const errors: string[] = [];
      let record = undefined,
        valid = false,
        stakeData;

      if (!address || address.substring(0, 2) !== "0x" || address.length !== 42) {
        valid = false;
        throw Error("Not a proper ethereum address");
      }

      try {
        stakeData = await verifyStake(payload, context);
      } catch (error: unknown) {
        errors.push(String(error));
      }

      const selfStakeAmount = stakeData.selfStake;
      const communityStakes = stakeData.communityStakes;
      const commStakeCounts = await checkCommunityStakes(communityStakes, address);

      if (selfStakeAmount >= this.threshold) valid = true;

      for (const [key, val] of Object.entries(commStakeCounts)) {
        if (val >= this.communityTypeCount && this.identifier === key) {
          valid = true;
        }
      }

      if (valid) {
        record = {
          address: payload.address,
          stakeAmount: this.identifier,
        };
      } else if (!valid && selfStakeAmount < this.threshold) {
        errors.push(
          `Your current GTC self staking amount is ${selfStakeAmount.toString()} GTC, which is below the required ${this.threshold.toString()} GTC for this stamp.`
        );
      } else {
        errors.push(
          "You are not staking enough on community members and/or community members are not staking enough on you 🥲"
        );
      }

      return {
        valid,
        record,
        errors,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`${this.type} verifyStake: ${String(e)}.`);
    }
  }
}

async function checkCommunityStakes(communityStakes: Stake[], address: string): Promise<CommunityStakingCounts> {
  const bcsMap = new Map<string, number>();
  const ecsMap = new Map<string, number>();
  const tcMap = new Map<string, number>();
  const tcSet = new Set();

  for (let i = 0; i < communityStakes.length; i++) {
    const stake = communityStakes[i];
    const cid = await buildCID({ address: stake.address, staker: stake.staker, amount: stake.amount });
    const currentAmount = new BigNumber(stake.amount);

    if (stake.address === address || stake.staker === address) {
      if (currentAmount.gte(5) && currentAmount.lt(10)) {
        bcsMap.set(cid, (bcsMap.get(cid) || 0) + 1);
      }
      if (currentAmount.gte(10) && currentAmount.lt(20)) {
        bcsMap.set(cid, (bcsMap.get(cid) || 0) + 1);
        ecsMap.set(cid, (ecsMap.get(cid) || 0) + 1);
      }
    }

    if (stake.address === address && currentAmount.gte(20)) {
      if (!tcSet.has(stake.staker)) {
        tcSet.add(stake.staker);
        bcsMap.set(cid, (bcsMap.get(cid) || 0) + 1);
        ecsMap.set(cid, (ecsMap.get(cid) || 0) + 1);
        tcMap.set(cid, (tcMap.get(cid) || 0) + 1);
      }
    }
  }

  // Use the maps to find unpaired CIDs.
  const bcs1gte5 = [...bcsMap].filter(([_, count]) => count === 1).map(([cid, _]) => cid).length;
  const ecs2gte10 = [...ecsMap].filter(([_, count]) => count === 1).map(([cid, _]) => cid).length;
  const tc5gte20 = [...tcMap].filter(([_, count]) => count === 1).map(([cid, _]) => cid).length;

  return {
    bcs1gte5,
    ecs2gte10,
    tc5gte20,
  };
}

async function verifyStake(payload: RequestPayload, context: GtcStakingContext): Promise<UserStake> {
  try {
    if (!context.gtcStaking?.userStake) {
      const round = process.env.GTC_STAKING_ROUND || "1";
      const address = payload.address.toLowerCase();

      const selfStakes: Stake[] = [];
      const communityStakes: Stake[] = [];

      const response: StakeResponse = await axios.get(`${gtcStakingEndpoint}/${address}/${round}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const results: Stake[] = response.data.results;

      results.forEach((stake: Stake) => {
        stake.event_type === "SelfStake" ? selfStakes.push(stake) : communityStakes.push(stake);
      });

      const selfStake: BigNumber = selfStakes.reduce((acc, curr) => {
        if (curr.staked === true) {
          return acc.plus(new BigNumber(curr.amount));
        } else {
          return acc.minus(new BigNumber(curr.amount));
        }
      }, new BigNumber(0));

      if (!context.gtcStaking) context.gtcStaking = {};

      context.gtcStaking.userStake = { selfStake, communityStakes };
    }
  } catch (error) {
    handleProviderAxiosError(error, "Verify GTC stake", [payload.address]);
  }
  return context.gtcStaking.userStake;
}
