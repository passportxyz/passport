// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { getUserData } from "./shared";

export class ImpactSelfOwnershipProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "ImpactSelf#Claimed";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that address defined in the payload has an Impact Self
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    let valid = false;
    let isImpactSelfOwner: boolean;
    try {
      isImpactSelfOwner = (await getUserData(address)).isOwner;
    } catch (e) {
      return {
        valid: false,
        error: ["Impact Self provider get user ownership error"],
      };
    }
    valid = isImpactSelfOwner;
    return Promise.resolve({
      valid: valid,
      record: valid
        ? {
            address: address,
            isImpactSelfOwner: String(isImpactSelfOwner),
          }
        : {},
    });
  }
}
