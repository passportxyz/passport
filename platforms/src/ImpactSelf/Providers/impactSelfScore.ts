// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { getUserData } from "./shared";

export class ImpactSelfScoreProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  // Options can be set here and/or via the constructor
  _options = {
    typeName: "",
    threshold: 100,
    error: "Impact Self provider get user score error",
  };

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
    this.type = this._options.typeName;
  }

  // Verify that address defined in the payload has an Impact Self
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    let valid = false;
    let userScore: number;
    try {
      userScore = (await getUserData(address)).score;
    } catch (e) {
      return {
        valid: false,
        error: [this._options.error],
      };
    }
    valid = userScore > this._options.threshold;
    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            address: address,
            userScore: userScore.toString(),
          }
        : {},
    });
  }
}
