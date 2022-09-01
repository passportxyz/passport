// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../utils/signer";

// https://docs.zksync.io/api/v0.2/
export const zkSyncApiEnpoint = "https://api.zksync.io/api/v0.2/";

// Pagination structure
type Pagination = {
  from: string;
  limit: number;
  direction: string;
  count: number;
};

// Defining interfaces for the data structure returned by the subgraph
type ZKSyncTransaction = {
  txHash: string;
  op: { from: string; to: string };
  status: string;
};

type ZkSyncResponse = {
  status: string;
  error: unknown;
  result: { list: ZKSyncTransaction[] };
  pagination: Pagination;
};

// Export a ZkSyncProvider Provider
export class ZkSyncProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "ZkSync";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload has at least 1 finalized transactioin
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    let valid = false;
    let error = undefined;

    const address = (await getAddress(payload)).toLowerCase();

    try {
      const requestResponse = await axios.get(`${zkSyncApiEnpoint}accounts/${address}/transactions`, {
        params: {
          from: "latest",
          limit: 100,
          direction: "older",
        },
      });

      if (requestResponse.status == 200) {
        const zkSyncResponse = requestResponse.data as ZkSyncResponse;

        if (zkSyncResponse.status === "success") {
          // We consider the verification valid if this account has at least one finalized
          // transaction initiated by this account
          for (let i = 0; i < zkSyncResponse.result.list.length; i++) {
            const t = zkSyncResponse.result.list[i];
            if (t.status === "finalized") {
              if (t.op.from === address) {
                valid = true;
                break;
              }
            }
          }

          if (!valid) {
            error = ["Unable to find a finalized transaction from the given address"];
          }
        } else {
          error = [`ZKSync API Error '${zkSyncResponse.status}'. Details: '${zkSyncResponse.error.toString()}'.`];
        }
      } else {
        error = [`HTTP Error '${requestResponse.status}'. Details: '${requestResponse.statusText}'.`];
      }
    } catch (exc) {
      error = ["Error getting transaction list for address"];
    }
    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            address: address,
          }
        : undefined,
      error,
    });
  }
}
