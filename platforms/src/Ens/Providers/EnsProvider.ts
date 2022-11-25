import { StaticJsonRpcProvider } from "@ethersproject/providers";
// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Ethers library
import { utils } from "ethers";

// ----- Credential verification
import { getRPCProvider } from "../../utils/signer";

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

  // Verify that the address defined in the payload has an ENS reverse lookup registered
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const provider = getRPCProvider(payload);

      const staticProvider: StaticJsonRpcProvider = new StaticJsonRpcProvider(payload.rpcUrl);
      // lookup ens name

      const reportedName = await staticProvider.lookupAddress(payload.address);
      if (!reportedName) return { valid: false, error: ["Ens name was not found for given address."] };

      // lookup the address resolved to an ens name
      const resolvedAddress = await provider.resolveName(reportedName);

      // if the addresses match this is a valid ens lookup
      const valid = utils.getAddress(payload.address) === utils.getAddress(resolvedAddress);

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
