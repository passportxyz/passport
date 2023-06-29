import type { Provider } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { CivicPassType } from "./passType";
import { EVM_CHAIN_CONFIG, SupportedChain } from "./evmChainConfig";
import { findAllPasses, latestExpiry, secondsFromNow } from "./util";

/* eslint-enable @typescript-eslint/no-unsafe-call */

type CivicPassProviderOptions = {
  chains?: SupportedChain[];
  passType: CivicPassType;
  type: string;
  includeTestnets?: boolean;
};

// Export a Civic Pass Provider
export class CivicPassProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type: string;
  passType: CivicPassType;
  chains: SupportedChain[];

  // Options can be set here and/or via the constructor
  defaultOptions = {
    chains: Object.keys(EVM_CHAIN_CONFIG) as SupportedChain[],
    includeTestnets: false,
  };

  // construct the provider instance with supplied options
  constructor(options: CivicPassProviderOptions) {
    const fullOptions = { ...this.defaultOptions, ...options };
    this.type = fullOptions.type;
    this.passType = fullOptions.passType;
    // filter unsupported chains or non-mainnet chains (if includeTestnets is false)
    this.chains = fullOptions.chains.filter(
      (chain) => EVM_CHAIN_CONFIG[chain] && (fullOptions.includeTestnets || EVM_CHAIN_CONFIG[chain].mainnet)
    );
  }

  // Verify that address defined in the payload has a civic pass
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    const passResponses = await findAllPasses(address, this.chains, [this.passType]);

    const error = passResponses
      .map((response) => response.error?.error)
      .filter((errorMessage) => errorMessage !== undefined);
    const passes = passResponses.map((response) => response.pass).filter((pass) => pass !== undefined);
    const valid = passes.length > 0;
    const expiry = secondsFromNow(latestExpiry(passes));

    return {
      valid,
      error,
      expiresInSeconds: expiry,
      record: valid
        ? {
            address: address,
          }
        : {},
    };
  }
}
