import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import type { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { getAddress } from "../../utils/signer";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

const verificationLink = "https://api.micapass.com/api/v1/check/gitcoin/identity";

interface MicapassCheckResponse<T> {
  valid: boolean;
  data: T;
}

interface IdentityDeployedData {
  identity: string;
  expiresIn?: number;
  record?: { [k: string]: string };
}
interface IsIdentityDeployedResponse extends MicapassCheckResponse<IdentityDeployedData> {}

export class MicapassIdentityProvider implements Provider {
  type = "MicapassIdentityProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verify(payload: RequestPayload, context?: ProviderContext): Promise<VerifiedPayload> {
    const extractedAddress: string = await getAddress(payload);
    const errors = [];
    try {
      const response: IsIdentityDeployedResponse = await this.getIsIdentityDeployed(extractedAddress);
      const valid: boolean = !!response?.valid;

      if (response?.valid == null) {
        errors.push("User's identity verification failed.");
      } else if (!valid) {
        errors.push("User has not deployed identity yet.");
      }

      const expiresIn = response?.data?.expiresIn;
      const identityAddress = response?.data?.identity;

      // Record must include user's address, identity address as well as
      // other records for this verification, received from Micapass backend
      const record = { address: extractedAddress, identityAddress: identityAddress, ...response?.data?.record };
      return { valid: valid, record, errors, expiresInSeconds: expiresIn };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(
        `Micapass indentity deployment verification failure: ${JSON.stringify(e)}}`
      );
    }
  }

  private async getIsIdentityDeployed(address: string): Promise<IsIdentityDeployedResponse> {
    const apiKey = process.env.MICAPASS_API_KEY;
    const formattedLink = `${verificationLink}?address=${address}`;
    try {
      const requestResponse = await axios.get(formattedLink, {
        // Only throw on status code 5XX
        validateStatus: (s) => s % 100 != 5,
        headers: { "x-api-key": apiKey },
      });

      return requestResponse.data as IsIdentityDeployedResponse;
    } catch (error) {
      handleProviderAxiosError(error, "Micapass", [address]);
    }
  }
}
