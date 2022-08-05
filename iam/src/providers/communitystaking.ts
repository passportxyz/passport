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
  amount: string;
}

interface XStakeArray {
  xstakeOnMe: Array<XStake>;
}

interface UsersArray {
  users: Array<XStakeArray>;
}

interface StakeData {
  data: UsersArray;
}

interface StakeResult {
  data: StakeData;
}

async function verifyStake(payload: RequestPayload): Promise<StakeResponse> {
  const address = payload.address.toLocaleLowerCase();
  const result = await axios.post(stakingSubgraph, {
    query: `
    {
      users(where: {address: "${address}"}) {
        xstakeOnMe {
          round {
            id
          }
          amount
        }
      }
    }
      `,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  console.log("view results ", result.data.data, result.data.data.users[0]);

  const r = result as StakeResult;
  const xstakes = r?.data?.data?.users[0].xstakeOnMe || [];

  console.log("view xtake ", xstakes);

  let response: StakeResponse = {};

  if (xstakes.length > 0) {
    let totalAmountStaked = 0;
    xstakes.forEach((xstake) => {
      const stakeAmountFormatted: string = utils.formatUnits(xstake.amount.toString(), 18);
      totalAmountStaked += parseFloat(stakeAmountFormatted);
    });
    response = {
      totalAmountStaked: totalAmountStaked,
      address: address,
    };
  }

  return response;
}

// Export a Self Staking Bronze Stamp provider
// User's self stake must be greater than 1 GTC
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

      valid = stakeAmount > 10.0;

      return {
        valid,
        record: {
          address: payload.address,
          stakeAmount: valid ? "Greater Than 10 GTC" : "Less Than 10 GTC",
        },
      };
    } catch (e) {
      return {
        valid: false,
        error: [JSON.stringify(e)],
      };
    }
  }
}

// Export a Self Staking Bronze Stamp provider
// User's self stake must be greater than 1 GTC
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

      valid = stakeAmount > 100.0;

      return {
        valid,
        record: {
          address: payload.address,
          stakeAmount: valid ? "Greater Than 10 GTC" : "Less Than 10 GTC",
        },
      };
    } catch (e) {
      return {
        valid: false,
        error: [JSON.stringify(e)],
      };
    }
  }
}

// Export a Self Staking Bronze Stamp provider
// User's self stake must be greater than 1 GTC
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

      valid = stakeAmount > 500.0;

      return {
        valid,
        record: {
          address: payload.address,
          stakeAmount: valid ? "Greater Than 10 GTC" : "Less Than 10 GTC",
        },
      };
    } catch (e) {
      return {
        valid: false,
        error: [JSON.stringify(e)],
      };
    }
  }
}
