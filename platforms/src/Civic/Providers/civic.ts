import type { Provider } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { CivicPassType } from "./types";
import { errorToString, findAllPasses, latestExpiry, secondsFromNow } from "./util";

// If the environment variable INCLUDE_TESTNETS is set to true,
// then passes on testnets will be included in the verification by default.
const defaultIncludeTestnets = process.env.INCLUDE_TESTNETS === "true";

type CivicPassProviderOptions = {
  passType: CivicPassType;
  type: string;
  includeTestnets?: boolean;
};

// Export a Civic Pass Provider
export class CivicPassProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type: string;
  passType: CivicPassType;
  includeTestnets: boolean;

  // Options can be set here and/or via the constructor
  defaultOptions = {
    includeTestnets: defaultIncludeTestnets,
  };

  // construct the provider instance with supplied options
  constructor(options: CivicPassProviderOptions) {
    const fullOptions = { ...this.defaultOptions, ...options };
    this.type = fullOptions.type;
    this.passType = fullOptions.passType;
    this.includeTestnets = fullOptions.includeTestnets;
  }

  // Verify that address defined in the payload has a civic pass
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // if a signer is provider we will use that address to verify against
    const address = payload.address.toString().toLowerCase();
    try {
      const allPasses = await findAllPasses(address, this.includeTestnets);
      const filteredPasses = allPasses.filter((pass) => pass.type === this.passType);

      const valid = filteredPasses.length > 0;
      const expiry = valid ? secondsFromNow(latestExpiry(filteredPasses)) : undefined;

      return {
        valid,
        expiresInSeconds: expiry,
        record: valid
          ? {
              address: address,
            }
          : {},
      };
    } catch (e) {
      return {
        valid: false,
        error: [errorToString(e)],
        record: {},
      };
    }
  }
}
