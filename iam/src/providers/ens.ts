// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@dpopp/types";

// ----- Ethers library
import { utils, providers } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// MAINNET is the
const RPC_URL = process.env.NODE_ENV === "production" ? process.env.MAINNET_RPC_URL : process.env.GOERLI_RPC_URL;

// Checking a valid tokenId for a result from Ens will result in the following type
type EnsResponse = {
  ens?: string;
  ensVerified: boolean;
};

// Export a Ens Provider to carry out OAuth and return a record object
export class EnsProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Ens";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: EnsResponse = { ensVerified: false };
    const { address } = payload;

    try {
      // define a provider using the mainnet rpc
      const provider: StaticJsonRpcProvider = new providers.StaticJsonRpcProvider(RPC_URL);

      // lookup ens name
      const reportedName: string = await provider.lookupAddress(address);

      if (!reportedName) return { valid: false, error: ["Ens name was not found for given address."] };

      const resolveAddress = await provider.resolveName(reportedName);

      if (address && utils.getAddress(address) === utils.getAddress(resolveAddress)) {
        verifiedPayload = { ens: reportedName, ensVerified: true };
      } else {
        verifiedPayload = { ens: undefined, ensVerified: false };
      }

      valid = verifiedPayload && verifiedPayload.ensVerified;

      return {
        valid: valid,
        record: {
          ens: verifiedPayload.ens,
        },
      };
    } catch (e) {
      return {
        valid: false,
      };
    }
  }
}
