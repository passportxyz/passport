// ----- Types
import { Provider, ProviderExternalVerificationError, ProviderOptions } from "../../types.js";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../../utils/signer.js";

// This is used in the Era Explorer
export const zkSyncEraApiEndpoint = process.env.ZKSYNC_ERA_MAINNET_ENDPOINT || "";

type ZKSyncEraTransaction = {
  from: string;
  status: string;
};

type ZkSyncEraResponse = {
  items: ZKSyncEraTransaction[];
  total: number;
};

// Export a Provider to verify ZkSync Era Transactions
export class ZkSyncEraProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "ZkSyncEra";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload has at least 1 verified transaction
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    let valid = false;
    const errors = [];

    try {
      const address = (await getAddress(payload)).toLowerCase();
      const requestResponse = await axios.get(
        `${zkSyncEraApiEndpoint}/transactions?address=${address}&limit=100&direction=older`
      );
      if (requestResponse.status == 200) {
        const zkSyncResponse = requestResponse.data as ZkSyncEraResponse;

        // We consider the verification valid if this account has at least one verified
        // transaction initiated by this account
        for (let i = 0; i < zkSyncResponse.items.length; i++) {
          const tx = zkSyncResponse.items[i];
          if (tx.status === "verified" && tx.from.toLowerCase() === address) {
            valid = true;
            break;
          }
        }

        if (!valid) {
          errors.push("Unable to find a verified transaction from the given address");
        }
      } else {
        errors.push(`HTTP Error '${requestResponse.status}'. Details: '${requestResponse.statusText}'.`);
      }
      return Promise.resolve({
        valid: valid,
        record: valid
          ? {
              address: address,
            }
          : undefined,
        errors,
      });
    } catch (error) {
      throw new ProviderExternalVerificationError(
        `ZkSyncEra error was thrown while trying to verify transaction history. error: ${JSON.stringify(error)}`
      );
    }
  }
}
