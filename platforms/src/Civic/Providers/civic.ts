// ----- Types
import type { Provider } from "../../types.js";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { CivicPassType } from "./types.js";

// ----- Utils
import { findAllPasses, latestExpiry, secondsFromNow, getNowAsBigNumberSeconds } from "./util.js";

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
    const address = payload.address.toString().toLowerCase();
    const now = getNowAsBigNumberSeconds();
    let errors, record, expiresInSeconds;
    let valid = false;

    const allPasses = await findAllPasses(address, this.includeTestnets, [this.passType]);
    const activePasses = allPasses.filter(({ state }) => state === "ACTIVE");
    const validPasses = activePasses.filter(({ expiry }) => expiry > now);

    if (allPasses.length === 0) {
      errors = [`You do not have a ${CivicPassType[this.passType]} pass.`];
    } else if (activePasses.length === 0) {
      errors = [
        `Your ${CivicPassType[this.passType]} pass${allPasses.length > 1 ? "es are" : " is"} frozen or revoked.`,
      ];
    } else if (validPasses.length === 0) {
      errors = [`Your ${CivicPassType[this.passType]} pass${activePasses.length > 1 ? "es are" : " is"} expired.`];
    } else {
      record = { address };
      valid = true;
      expiresInSeconds = secondsFromNow(latestExpiry(validPasses));
    }

    return {
      valid,
      errors,
      expiresInSeconds,
      record,
    };
  }
}
