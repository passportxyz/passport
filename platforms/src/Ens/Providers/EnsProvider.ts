// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Credential verification
import { getRPCProvider } from "../../utils/signer";

const ENS_PUBLIC_RESOLVERS = [
  "0x231b0ee14048e9dccd1d247744d114a4eb5e8e63",
  "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41",
];

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

  // Verify that the address defined in the payload has an ENS reverse lookup registered
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const errors = [];
    let valid = false,
      reportedName: string,
      record = undefined;

    try {
      const provider = getRPCProvider(RPC_URL);
      reportedName = await provider.lookupAddress(payload.address);

      if (reportedName) {
        const resolver = await provider.getResolver(reportedName);
        if (ENS_PUBLIC_RESOLVERS.includes(resolver?.address?.toLowerCase())) {
          valid = true;
          record = {
            ens: reportedName,
          };
        } else {
          errors.push(
            "Apologies! Your primary ENS name uses an alternative resolver and is not eligible for the ENS stamp."
          );
        }
      } else {
        errors.push("Primary ENS name was not found for given address.");
      }

      return {
        valid,
        errors,
        record,
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Error verifying ENS name: ${String(e)}`);
    }
  }
}
