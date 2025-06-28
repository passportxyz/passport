import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderOptions } from "../../types.js";
import axios from "axios";
import { getAddress } from "../../utils/signer.js";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

export const holonymBiometricsApiEndpoint = "https://api.holonym.io/sybil-resistance/biometrics/optimism";

type SybilResistanceResponse = {
  result: boolean;
};

const actionId = 123456789;

export class BiometricsProvider implements Provider {
  type = "Biometrics";
  _options = {};

  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = (await getAddress(payload)).toLowerCase();
    const errors = [];
    let record = undefined,
      valid = false;

    // Check if address has completed biometric verification
    const response = await getIsUnique(address);
    valid = response.result;

    if (valid) {
      record = {
        address,
      };
    } else {
      errors.push(
        `We were unable to verify that your address has completed biometric verification -- isUnique: ${String(valid)}.`
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
    const requestResponse = await axios.get(`${holonymBiometricsApiEndpoint}?user=${address}&action-id=${actionId}`);

    return requestResponse.data as SybilResistanceResponse;
  } catch (error: unknown) {
    handleProviderAxiosError(error, "holonym biometrics", [address]);
  }
};
