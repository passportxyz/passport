// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { utils } from "ethers";

// ----- Libs
import axios from "axios";

// List of subgraphs to check
export const stakingSubgraph = "https://api.thegraph.com/subgraphs/name/moonshotcollective/id-staking";

type StakeResponse = {
  totalAmountStaked?: number;
  address?: string;
};

// Defining interfaces for the data structure returned by the subgraph
interface Round {
  id: string;
}

interface XStake {
  round: Round;
  total: string;
}

interface XStakeArray {
  xstakeAggregates: Array<XStake>;
}

interface UsersArray {
  address: string;
  users: Array<XStakeArray>;
}

interface StakeData {
  data: UsersArray;
}

export interface DataResult {
  data: StakeData;
}

async function verifyStake(payload: RequestPayload): Promise<StakeResponse> {
  const address = payload.address.toLowerCase();
  const result = await axios.post(stakingSubgraph, {
    query: `
    {
      users(where: {address: "${address}"}) {
        address,
        xstakeAggregates(where: {round: "1", total_gt: 0}) {
          total
          round {
            id
          }
        }
      }
    }
      `,
  });

  const r = result as DataResult;

  const response: StakeResponse = {
    address: address,
    totalAmountStaked: 0,
  };
  // Array of community stakes on the user
  const xstake = r?.data?.data?.users[0]?.xstakeAggregates[0]?.total;
  if (!xstake) {
    return response;
  }
  const stakeAmountFormatted: string = utils.formatUnits(xstake, 18);
  return {
    totalAmountStaked: parseFloat(stakeAmountFormatted),
    address: address,
  };
}

// Export a Community Staking Bronze Stamp provider
// User's community stake must be greater than or equal to 1 GTC
export class CommunityStakingBronzeProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "CommunityStakingBronze";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    try {
      const stakeData = await verifyStake(payload);
      const stakeAmount = stakeData.totalAmountStaked;
      valid = stakeAmount >= 1.0;

      return {
        valid,
        record: valid
          ? {
              address: stakeData.address,
              // csgte1 = Community staking greater than or equal to 1
              stakeAmount: "csgte1",
            }
          : {},
      };
    } catch (e) {
      return {
        valid: false,
        error: ["Community Staking Bronze Provider verifyStake Error"],
      };
    }
  }
}

// Export a Community Staking Silver Stamp provider
// User's community stake must be greater than or equal to 10 GTC
export class CommunityStakingSilverProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "CommunityStakingSilver";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    try {
      const stakeData = await verifyStake(payload);
      const stakeAmount = stakeData.totalAmountStaked;

      valid = stakeAmount >= 10.0;

      return {
        valid,
        record: valid
          ? {
              address: stakeData.address,
              // csgte10 = Community staking greater or equal than 10
              stakeAmount: "csgte10",
            }
          : {},
      };
    } catch (e) {
      return {
        valid: false,
        error: ["Community Staking Silver Provider verifyStake Error"],
      };
    }
  }
}

// Export a Community Staking Bronze Stamp provider
// User's community stake must be greater than or equal to 100 GTC
export class CommunityStakingGoldProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "CommunityStakingGold";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    try {
      const stakeData = await verifyStake(payload);
      const stakeAmount = stakeData.totalAmountStaked;
      valid = stakeAmount >= 100.0;

      return {
        valid: valid,
        record: valid
          ? {
              address: stakeData.address,
              // csgt100 = Community staking greater than or equal to 100
              stakeAmount: "csgte100",
            }
          : {},
      };
    } catch (e) {
      return {
        valid: false,
        error: ["Community Staking Gold Provider verifyStake Error"],
      };
    }
  }
}
