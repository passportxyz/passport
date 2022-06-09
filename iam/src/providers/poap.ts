// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// List of POAP subgraphs to check
export const poapSubgraphs = [
  "https://api.thegraph.com/subgraphs/name/poap-xyz/poap",
  "https://api.thegraph.com/subgraphs/name/poap-xyz/poap-xdai",
];

// Compute the minimum required token age as milliseconds
const minTokenAge = 15 * 24 * 3600000;

// Defining interfaces for the data structure returned by the subgraph
interface Token {
  id: string;
  created: number; // Number of seconds since start of epoch
}

interface Account {
  tokens: Array<Token>;
}

interface DataAccount {
  account: Account;
}

interface Data {
  data: DataAccount;
}

interface Result {
  data: Data;
}

type PoapCheckResult = {
  hasPoaps: boolean;
  poapList: string[];
};

// Export a POAP Provider
export class POAPProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "POAP";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address that is passed in owns at least one POAP older than 15 days
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address.toLocaleLowerCase();
    let poapCheckResult = {
      hasPoaps: false,
      poapList: null as string[],
    };

    async function checkForPoaps(url: string): Promise<PoapCheckResult> {
      let hasPoaps = false;
      let poapList = null as string[];
      const result = await axios.post(url, {
        query: `
          {
            account(id: "${address}") {
              tokens(orderBy: created, orderDirection: asc) {
                id
                created
              }
            }
          }
          `,
      });

      const r = result as Result;
      const tokens = r?.data?.data?.account?.tokens || [];

      if (tokens.length > 0) {
        // If at least one token is present, check the oldest one
        const oldestToken = tokens[0];
        const age = Date.now() - oldestToken.created * 1000;
        hasPoaps = age > minTokenAge;
        if (hasPoaps) {
          poapList = tokens.map((token) => token.id);
        }
      }

      // Return false by default (if tokens array is empty or no matching verification)
      return {
        hasPoaps,
        poapList,
      };
    }

    // Verify if the user has poaps on all supported networks
    for (let i = 0; !poapCheckResult.hasPoaps && i < poapSubgraphs.length; i++) {
      poapCheckResult = await checkForPoaps(poapSubgraphs[i]);
    }

    return Promise.resolve({
      valid: poapCheckResult.hasPoaps,
      record: {
        address: poapCheckResult.hasPoaps ? address : undefined,
      },
    });
  }
}
