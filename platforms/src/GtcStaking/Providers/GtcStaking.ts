// ----- Types
import { ProviderExternalVerificationError, type Provider } from "../../types";
import type { ProviderContext, PROVIDER_ID, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

const gtcStakingEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}registry/gtc-stake`;
const apiKey = process.env.SCORER_API_KEY;

type UserStake = {
  selfStake: number;
  communityStakes: Stake[];
};

type Stake = {
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
  begCommStakeCount: number;
  expCommStakeCount: number;
  trustCitStakerCount: number;
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
  threshold?: number;
  dataKey: keyof UserStake;
  communityTypeCount?: number | undefined;
  // Only needed for historic hashes, can be left
  // off of any new providers
  identifier?: string;
};

export class GtcStakingProvider implements Provider {
  type: PROVIDER_ID;
  threshold?: number;
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
        valid = false;
      const stakeData = await verifyStake(payload, context);
      const selfStakeAmount = stakeData.selfStake;
      const communityStakes = stakeData.communityStakes;
      const commStakeCounts = checkCommunityStakes(communityStakes, address);

      if (selfStakeAmount >= this.threshold) {
        valid = true;
      }

      for (const [key, val] of Object.entries(commStakeCounts)) {
        if (val >= this.communityTypeCount) {
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
          `Your current GTC self staking amount is ${selfStakeAmount} GTC, which is below the required ${this.threshold} GTC for this stamp.`
        );
      } else {
        errors.push(
          "You are not staking enough on the community members and/or the community members are not staking enough on you 🥲"
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

function checkCommunityStakes(communityStakes: Stake[], address: string): CommunityStakingCounts {
  let begCommStakeCount = 0;
  let expCommStakeCount = 0;
  const trustCitStakers = new Set();
  const trustCitStakerCount = trustCitStakers.size;

  communityStakes.forEach((stake: Stake) => {
    if (
      (stake.address === address && parseInt(stake.amount) >= 5) ||
      (stake.staker !== address && parseInt(stake.amount) >= 5)
    ) {
      begCommStakeCount += 1;
    }

    if (
      (stake.address === address && parseInt(stake.amount) >= 10) ||
      (stake.staker !== address && parseInt(stake.amount) >= 10)
    ) {
      expCommStakeCount += 1;
    }

    if (stake.address === address && parseInt(stake.amount) >= 20) {
      trustCitStakers.add(stake.staker);
    }
  });

  return {
    begCommStakeCount,
    expCommStakeCount,
    trustCitStakerCount,
  };
}

async function verifyStake(payload: RequestPayload, context: GtcStakingContext): Promise<UserStake> {
  try {
    if (!context.gtcStaking?.userStake) {
      const round = process.env.GTC_STAKING_ROUND || "1";
      const address = payload.address.toLowerCase();

      const selfStakes: Stake[] = [];
      const communityStakes: Stake[] = [];

      if (!address || address.substring(0, 2) !== "0x") {
        throw Error("Not a proper address");
      }

      const response: StakeResponse = await axios.get(`${gtcStakingEndpoint}/${address}/${round}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      const results: Stake[] = response.data.results;

      results.forEach((stake: Stake) => {
        stake.event_type === "SelfStake" ? selfStakes.push(stake) : communityStakes.push(stake);
      });

      const maxSelfStake: number | undefined = selfStakes.reduce((acc, curr) => {
        if (curr.staked === true) {
          return acc + parseInt(curr.amount);
        }
      }, 0);

      const selfStake = maxSelfStake;

      if (!context.gtcStaking) context.gtcStaking = {};

      context.gtcStaking.userStake = { selfStake, communityStakes };
    }
  } catch (error) {
    handleProviderAxiosError(error, "Verify GTC stake", [payload.address]);
  }
  return context.gtcStaking.userStake;
}
