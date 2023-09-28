// ----- Types
import { ProviderExternalVerificationError, type Provider } from "../../types";
import type { ProviderContext, PROVIDER_ID, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { BigNumber } from "ethers";

// ----- Libs
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

// List of subgraphs to check
export const stakingSubgraph = `https://gateway.thegraph.com/api/${process.env.GTC_STAKING_GRAPH_API_KEY}/subgraphs/id/6neBRm8wdXfbH9WQuFeizJRpsom4qovuqKhswPBRTC5Q`;

type UserStake = {
  selfStake: BigNumber;
  communityStake: BigNumber;
};

// Defining interfaces for the data structure returned by the subgraph
interface Stake {
  stake: string;
}

interface XStake {
  total: string;
}

interface User {
  stakes: Stake[];
  xstakeAggregates: XStake[];
}

export interface StakeResponse {
  data: {
    data: {
      users: User[];
    };
  };
}

export type GtcStakingContext = ProviderContext & {
  gtcStaking?: {
    userStake?: UserStake;
  };
};

export type GtcStakingProviderOptions = {
  type: PROVIDER_ID;
  weiThreshold: BigNumber;
  dataKey: keyof UserStake;
  // Only needed for historic hashes, can be left
  // off of any new providers
  identifier?: string;
};

export class GtcStakingProvider implements Provider {
  type: PROVIDER_ID;
  weiThreshold: BigNumber;
  dataKey: keyof UserStake;
  identifier: string;

  // construct the provider instance with supplied options
  constructor(options: GtcStakingProviderOptions) {
    this.type = options.type;
    this.weiThreshold = options.weiThreshold;
    this.dataKey = options.dataKey;
    this.identifier = options.identifier;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: GtcStakingContext): Promise<VerifiedPayload> {
    try {
      const errors: string[] = [];
      let record = undefined;
      const stakeData = await verifyStake(payload, context);
      const stakeAmount = stakeData[this.dataKey];

      const valid = stakeAmount.gte(this.weiThreshold);
      if (valid) {
        record = {
          address: payload.address,
          stakeAmount: this.identifier,
        };
      } else {
        errors.push(
          `Your current GTC staking amount is ${String(stakeAmount)}, which is below the requirement for this stamp.`
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

export function getStakeQuery(address: string, round: string): string {
  return `
  {
    users(where: {address: "${address}"}) {
      stakes(where: {round: "${round}"}) {
        stake
      }
      xstakeAggregates(where: {round: "${round}", total_gt: 0}) {
        total
      }
    }
  }
  `;
}

async function verifyStake(payload: RequestPayload, context: GtcStakingContext): Promise<UserStake> {
  try {
    if (!context.gtcStaking?.userStake) {
      const round = process.env.GTC_STAKING_ROUND || "1";
      const address = payload.address.toLowerCase();

      if (!address || address.substring(0, 2) !== "0x") {
        throw Error("Not a proper address");
      }

      const response: StakeResponse = await axios.post(stakingSubgraph, {
        query: getStakeQuery(address, round),
      });

      // Array of self stakes on the user
      const selfStake = BigNumber.from(response?.data?.data?.users[0]?.stakes[0]?.stake || "0");
      const communityStake = BigNumber.from(response?.data?.data?.users[0]?.xstakeAggregates[0]?.total || "0");

      if (!context.gtcStaking) context.gtcStaking = {};

      context.gtcStaking.userStake = { selfStake, communityStake };
    }
  } catch (error) {
    handleProviderAxiosError(error, "Verify GTC stake", [payload.address]);
  }
  return context.gtcStaking.userStake;
}
