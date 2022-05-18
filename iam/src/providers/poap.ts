// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@dpopp/types";
import axios from "axios";

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
  verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address;
    console.log("geri payload", payload);
    // TODO geri: uri = 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap%s' % ('-xdai' if network == 'xdai' else '')
    // TODO geri: on which chain should I perform the verification? Always on ETH mainnet? Or use the chain which the user authorized?
    const url = "https://api.thegraph.com/subgraphs/name/poap-xyz/poap-xdai";
    const result = axios({
      url: url,
      method: "post",
      data: {
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
      },
    }).then((result) => {
      const r = result as Result;
      const tokens = r.data?.data?.account?.tokens || [];

      // tokens.forEach((token) => {
      //   console.log("geri token:", token);
      //   console.log("geri token:", token.id, token.created);
      // });

      if (tokens.length > 0) {
        // If at least one token is present, check the oldest one
        const oldestToken = tokens[0];
        const age = Date.now() - oldestToken.created * 1000;
        return age > minTokenAge;
      }

      // Return false by default (if tokens array is empty or no matching verification)
      return false;
    });

    return new Promise((resolve) => {
      result.then(
        (isValid) => {
          // Handle case when successfully processing
          resolve({
            valid: isValid,
            record: {
              // TODO geri: what information is relevant here?
              poapVerification: "YES :)",
            },
          });
        },
        () => {
          // Handle rejection / error
          resolve({
            valid: false,
          });
        }
      );
    });
  }
}
