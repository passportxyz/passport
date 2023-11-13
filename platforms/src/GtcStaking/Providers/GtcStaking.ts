// ----- Types
import { ProviderExternalVerificationError, ProviderInternalVerificationError, type Provider } from "../../types";
import type { ProviderContext, PROVIDER_ID, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";
import BigNumber from "bignumber.js";

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
  thresholdAmount: BigNumber;
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

  async getStakes(payload: RequestPayload, context: GtcStakingContext): Promise<UserStake> {
    try {
      if (!context.gtcStaking?.userStake) {
        const round = process.env.GTC_STAKING_ROUND || "1";
        const address = payload.address.toLowerCase();

        const selfStakes: Stake[] = [];
        const communityStakes: Stake[] = [];

        const response: StakeResponse = await axios.get(`${gtcStakingEndpoint}/${address}/${round}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        const results: Stake[] = response?.data?.results;
        if (!results) throw new ProviderExternalVerificationError("No results returned from the GTC Staking API");

        results.forEach((stake: Stake) => {
          stake.event_type === "SelfStake" ? selfStakes.push(stake) : communityStakes.push(stake);
        });

        const selfStake: BigNumber = selfStakes.reduce((totalStake, currentStake) => {
          if (currentStake.staked === true) {
            return totalStake.plus(new BigNumber(currentStake.amount));
          } else {
            return totalStake.minus(new BigNumber(currentStake.amount));
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
}
