// ----- Types
import { ProviderExternalVerificationError, ProviderInternalVerificationError, type Provider } from "../../types";
import type { ProviderContext, PROVIDER_ID, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";
import BigNumber from "bignumber.js";

export const gtcStakingEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}registry/gtc-stake`;
export const gtcStakingEndpointV2 = `${process.env.PASSPORT_SCORER_BACKEND}stake/gtc`;
const apiKey = process.env.SCORER_API_KEY;

type UserStake = {
  selfStake: BigNumber;
  communityStakes: Stake[];
  communityStakesV2: StakeV2[];
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

export type StakeV2 = {
  id: number;
  chain: number;
  lock_time: string;
  unlock_time: string;
  staker: string;
  stakee: string;
  amount: string;
};

export interface StakeResponse {
  data: {
    results: Stake[];
  };
}

export interface StakeV2Response {
  status: number;
  data: StakeV2[];
}

export type GtcStakingContext = ProviderContext & {
  gtcStaking?: {
    userStake?: UserStake;
  };
};

export type GtcStakingProviderOptions = {
  type: PROVIDER_ID;
  thresholdAmount: BigNumber;
};

export type RoundData = {
  id: number;
  start: number;
  duration: number;
};

export class GtcStakingProvider implements Provider {
  type: PROVIDER_ID;
  thresholdAmount: BigNumber;

  // construct the provider instance with supplied options
  constructor(options: GtcStakingProviderOptions) {
    this.type = options.type;
    this.thresholdAmount = options.thresholdAmount;
  }

  verify(_payload: RequestPayload, _context: GtcStakingContext): Promise<VerifiedPayload> {
    throw new Error("Method not implemented, this base class should not be used directly");
  }

  getAddress(payload: RequestPayload): string {
    const address = payload.address.toLowerCase();
    if (!address || address.substring(0, 2) !== "0x" || address.length !== 42) {
      throw new ProviderInternalVerificationError("Not a proper ethereum address");
    }
    return address;
  }

  getCurrentRound(): number {
    const stakingRounds = JSON.parse(process.env.GTC_STAKING_ROUNDS) as RoundData[];
    const currentRound = stakingRounds.find((round) => {
      const now = Date.now() / 1000;
      return now >= round.start && now < round.start + round.duration;
    });
    return currentRound?.id || 0;
  }

  async getStakes(payload: RequestPayload, context: GtcStakingContext): Promise<UserStake> {
    try {
      if (!context.gtcStaking?.userStake) {
        const round = this.getCurrentRound();
        const address = payload.address.toLowerCase();

        // Verify id staking legacy  
        const selfStakes: Stake[] = [];
        const communityStakes: Stake[] = [];

        const response: StakeResponse = await axios.get(`${gtcStakingEndpoint}/${address}/${round}`);
        const results: Stake[] = response?.data?.results || [];
       
        // Verify id staking V2
        const selfStakesV2: StakeV2[] = [];
        const communityStakesV2: StakeV2[] = [];
        
        const responseV2: StakeV2Response = await axios.get(`${gtcStakingEndpointV2}/${address}`, {
          headers: { Authorization: process.env.CGRANTS_API_TOKEN},
        });
        const resultsV2: StakeV2[] = (responseV2?.status >= 200 && responseV2?.status < 300  && responseV2?.data ) ? responseV2?.data : [];
        
        if ((results.length == 0) && (resultsV2.length == 0) ) throw new ProviderExternalVerificationError("No results returned from the GTC Staking API");

        // V0
        results.forEach((stake: Stake) => {
          stake.event_type === "SelfStake" ? selfStakes.push(stake) : communityStakes.push(stake);
        });

        // V2
        resultsV2.forEach( (stake:StakeV2) => {
          stake.staker ==  stake.stakee ? selfStakesV2.push(stake) : communityStakesV2.push(stake);
        });

        const selfStake: BigNumber = selfStakes.reduce((totalStake, currentStake) => {
          if (currentStake.staked === true) {
            return totalStake.plus(new BigNumber(currentStake.amount));
          } else {
            return totalStake.minus(new BigNumber(currentStake.amount));
          }
        }, new BigNumber(0));


        // SelfStake => total 
        const selfStakeV2: BigNumber = selfStakesV2.reduce((totalStake, currentStake) => {
          if (new Date(currentStake.unlock_time) > new Date()) {
            return totalStake.plus(new BigNumber(currentStake.amount));
          }
        }, new BigNumber(0));

        if (!context.gtcStaking) context.gtcStaking = {};

        const totalSelfStaked = selfStake.plus(selfStakeV2) // Return total from legacy self staked & V2 self staked
        context.gtcStaking.userStake = { selfStake: totalSelfStaked, communityStakes, communityStakesV2 };
      }
    } catch (error) {
      handleProviderAxiosError(error, "Verify GTC stake", [payload.address]);
    }
    return context.gtcStaking.userStake;
  }
}
