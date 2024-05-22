import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

import { getTokenBalance } from "./utils";

export const RPC_URL = process.env.RPC_URL;

export type ethErc721PossessionProviderOptions = {
    threshold: number;
    contractAddress: string;
    decimalNumber: number;
    error: string;
};

export class ProofOfPassportProvider implements Provider {
    type = "";

    _options: ethErc721PossessionProviderOptions = {
        threshold: 1,
        contractAddress: "0x98aA4401ef9d3dFed09D8c98B5a62FA325CF23b3",
        decimalNumber: 0,
        error: "Coin Possession Provider Error",
    };

    constructor(options: ProviderOptions = {}) {
        this._options = { ...this._options, ...options };
    }

    async verify(payload: RequestPayload): Promise<VerifiedPayload> {
        const { address } = payload;
        let valid = false;
        let amount = 0;
        try {
            amount = await getTokenBalance(address, this._options.contractAddress, this._options.decimalNumber, payload);

        } catch (e) {
            return {
                valid: false,
                errors: [this._options.error],
            };
        } finally {
            console.log("amount:", amount);
            valid = amount >= this._options.threshold;
        }
        return {
            valid,
            record: valid
                ? {
                    address: address.toLocaleLowerCase()
                }
                : {},
        };
    }
}