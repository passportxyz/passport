// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

export class FractalIdProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "FractalId";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      await new Promise(() => undefined);

      return {
        valid: true,
        record: {
          fractalUserId: "42",
        },
      };
    } catch (e) {
      return { valid: false };
    }
  }
}
