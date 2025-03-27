import { ProviderInternalVerificationError, type Provider, type ProviderOptions } from "../../types.js";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

export class TrustaLabsProvider implements Provider {
  type = "TrustaLabs";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    throw new ProviderInternalVerificationError("TrustaLabs provider is deprecated.");
  }
}
