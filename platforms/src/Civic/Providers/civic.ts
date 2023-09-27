// ----- Types
import { ProviderExternalVerificationError, type Provider } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { CivicPassType } from "./types";

// ----- Utils
import { findAllPasses, latestExpiry, secondsFromNow } from "./util";
import { log } from "console";

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
    const errors = [];
    let record = undefined;

    try {
      const allPasses = await findAllPasses(address, this.includeTestnets, [this.passType]);
      const valid = allPasses.length > 0;
      try {
        if (valid) {
          record = { address };
        } else {
          errors.push(`You do not have enough passes to qualify for this stamp. All passes: ${allPasses.length}.`);
        }
      } catch (e: unknown) {
        errors.push(String(e));
      }

      const expiry = valid ? secondsFromNow(latestExpiry(allPasses)) : undefined;

      return {
        valid,
        errors,
        expiresInSeconds: expiry,
        record: record,
      };
    } catch (e: unknown) {
      return Promise.reject(
        new ProviderExternalVerificationError(`Error verifying BrightID sponsorship: ${String(e)}`)
      );
    }
  }
}
