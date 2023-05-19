// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload, BrightIdVerificationResponse } from "@gitcoin/passport-types";

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

      const responseData = await verifyBrightidContextId(did);
      const formattedData: BrightIdVerificationResponse = responseData?.result as BrightIdVerificationResponse;

      // Unique is true if the user obtained "Meets" verification by attending a connection party
      const isUnique = "unique" in formattedData && formattedData.unique === true;
      const firstContextId =
        "contextIds" in formattedData && formattedData.contextIds.length > 0 && formattedData.contextIds[0];
      const valid: boolean = firstContextId && isUnique;

      return {
        valid,
        record: valid
          ? {
              context: "context" in formattedData && formattedData.context,
              contextId: firstContextId,
              meets: JSON.stringify(isUnique),
            }
          : undefined,
      };
    } catch (e) {
      return { valid: false };
    }
  }
}
