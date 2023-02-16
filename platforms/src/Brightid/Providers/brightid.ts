// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// --- verifyMethod in providers
import { getBrightidInfoForAddress } from "../procedures/brightid";

// Request a verifiable credential from brightid
export class BrightIdProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Brightid";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let record;
    try {
      const address = payload.address;

      if (address) {
        ({ valid } = await getBrightidInfoForAddress(address));
        if (valid) {
          record = {
            contextId: "GitcoinPassport",
          };
        }
      }
    } catch (e) {
    } finally {
      return { valid, record };
    }
  }
}
