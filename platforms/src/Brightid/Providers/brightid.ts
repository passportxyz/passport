// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// --- verifyMethod in providers
import { verifyBrightidContextId } from "../procedures/brightid";

// Request a verifiable credential from brightid
export class BrightIdProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Brightid";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const did = payload.proofs?.did;

      const responseData = await verifyBrightidContextId(did || "");
      const formattedData = responseData?.result;

      // Unique is true if the user obtained "Meets" verification by attending a connection party
      const isUnique = "unique" in formattedData && formattedData.unique === true;
      const verified = "verification" in formattedData && formattedData.verification;
      const valid: boolean = (verified && isUnique) || false;

      return {
        valid,
        record: valid
          ? {
              context: "verification" in formattedData && formattedData.verification,
              contextId: "Gitcoin",
              meets: JSON.stringify(isUnique),
            }
          : undefined,
      };
    } catch (e) {
      return { valid: false };
    }
  }
}
