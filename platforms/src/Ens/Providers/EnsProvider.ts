import { StaticJsonRpcProvider } from "@ethersproject/providers";
// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

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
    let error;
    let valid = false;
    let reportedName;

    try {
      const provider = getRPCProvider(payload);
      reportedName = await provider.lookupAddress(payload.address);
      valid = Boolean(reportedName);
      if (!valid) error = ["Primary ENS name was not found for given address."];
    } catch (e) {}

    return {
      valid: valid,
      error: error,
      record: valid
        ? {
            ens: reportedName,
          }
        : undefined,
    };
  }
}
