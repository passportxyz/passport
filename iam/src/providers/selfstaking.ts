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
  stakeAmount?: number;
  address?: string;
};

// Defining interfaces for the data structure returned by the subgraph
interface User {
  id: string;
}

interface Round {
  id: string;
}
interface Stake {
  id: string;
  user: User;
  round: Round;
  stake: string;
}

interface StakeArray {
  stakes: Array<Stake>;
}

interface Data {
  data: StakeArray;
}

interface StakeResult {
  data: Data;
}

async function verifyStake(payload: RequestPayload): Promise<StakeResponse> {
  const address = payload.address.toLocaleLowerCase();
  const result = await axios.post(stakingSubgraph, {
    query: `
    {
      stakes(where:{user: "${address}"}) {
        id,
        user {
          id
        },
        round {
          id
        },
        stake
      }
    }
      `,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  console.log("view results ", result.data.data);

  const r = result as StakeResult;
  const stakes = r?.data?.data?.stakes || [];

  let response: StakeResponse = {};

  if (stakes) {
    const stakeValue: string = stakes[0].stake;
    const stakeAmountFormatted: string = utils.formatUnits(stakeValue.toString(), 18);
    console.log("stake value ", stakeAmountFormatted);

    response = {
      stakeAmount: parseFloat(stakeAmountFormatted),
      address: address,
    };
  }

  return response;
}

// Export a Self Staking Bronze Stamp provider
// User's self stake must be greater than 1 GTC
export class SelfStakingBronzeProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "SelfStakingBronze";
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
      const stakeAmount = stakeData.stakeAmount;

      valid = stakeAmount > 1.0;

      return {
        valid,
        record: {
          address: payload.address,
          stakeAmount: valid ? "Greater Than 1 GTC" : "Less Than 1 GTC",
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
export class SelfStakingSilverProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "SelfStakingBronze";
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
      const stakeAmount = stakeData.stakeAmount;

      valid = stakeAmount > 5.0;

      return {
        valid,
        record: {
          address: payload.address,
          stakeAmount: valid ? "Greater Than 5 GTC" : "Less Than 5 GTC",
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
export class SelfStakingGoldProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "SelfStakingBronze";
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
      const stakeAmount = stakeData.stakeAmount;

      valid = stakeAmount > 50.0;

      return {
        valid,
        record: {
          address: payload.address,
          stakeAmount: valid ? "Greater Than 50 GTC" : "Less Than 50 GTC",
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
