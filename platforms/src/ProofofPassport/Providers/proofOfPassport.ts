import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

import { getTokenBalance } from "./utils";

export const OP_RPC_URL = process.env.OP_RPC_URL;

export type ethErc721PossessionProviderOptions = {
  threshold: number;
  contractAddress: string;
  decimalNumber: number;
};

export class ProofOfPassportProvider implements Provider {
  type = "ProofOfPassport";

  _options: ethErc721PossessionProviderOptions = {
    threshold: 1,
    contractAddress: "0x98aA4401ef9d3dFed09D8c98B5a62FA325CF23b3",
    decimalNumber: 0,
  };

  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { address } = payload;
    const errors = [];

    const amount = await getTokenBalance(address, this._options.contractAddress, this._options.decimalNumber, payload);
    const valid = amount >= this._options.threshold;

    if (!valid) {
      errors.push("Proof of Passport SBT not found for your address");
    }

    return {
      valid,
      record: valid
        ? {
            address: address.toLocaleLowerCase(),
          }
        : {},
      errors,
    };
  }
}
