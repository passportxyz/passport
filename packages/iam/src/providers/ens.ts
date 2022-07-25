// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { utils } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";

// set the network rpc url based on env
const RPC_URL = process.env.RPC_URL;

// Export a Ens Provider to carry out Ens name check and return a record object
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
    let valid = false;
    const { address } = payload;

    try {
      // define a provider using the rpc url
      const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(RPC_URL);

      // lookup ens name
      const reportedName: string = await provider.lookupAddress(address);

      if (!reportedName) return { valid: false, error: ["Ens name was not found for given address."] };

      // lookup the address resolved to an ens name
      const resolveAddress = await provider.resolveName(reportedName);

      if (utils.getAddress(address) === utils.getAddress(resolveAddress)) {
        valid = true;
      }

      return {
        valid: valid,
        record: {
          ens: valid ? reportedName : undefined,
        },
      };
    } catch (e) {
      return {
        valid: false,
      };
    }
  }
}
