// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types.js";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

// ----- Credential verification
import { getAddress } from "../../utils/signer.js";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

export const holonymApiEndpoint = "https://api.holonym.io/sybil-resistance/gov-id/optimism";

type SybilResistanceResponse = {
  result: boolean;
};

const actionId = 123456789;

export class HolonymGovIdProvider implements Provider {
  // Give the provider a type so that we can select it from a payload
  type = "HolonymGovIdProvider";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address defined in the payload has proven uniqueness using Holonym
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = (await getAddress(payload)).toLowerCase();
    const errors = [];
    let record = undefined,
      valid = false;

    // Check if address is unique for default Holonym action ID
    const response = await getIsUnique(address);
    valid = response.result;

    if (valid) {
      record = {
        // store the address into the proof records
        address,
      };
    } else {
      errors.push(
        `We were unable to verify that your address was unique for action -- isUniqueForAction: ${String(valid)}.`
      );
    }

    if (!valid && errors.length === 0) {
      errors.push("We are unable to determine the error at this time.");
    }

    return {
      valid,
      record,
      errors,
    };
  }
}

const getIsUnique = async (address: string): Promise<SybilResistanceResponse> => {
  try {
    const requestResponse = await axios.get(`${holonymApiEndpoint}?user=${address}&action-id=${actionId}`);

    return requestResponse.data as SybilResistanceResponse;
  } catch (error: unknown) {
    handleProviderAxiosError(error, "holonym", [address]);
  }
};
