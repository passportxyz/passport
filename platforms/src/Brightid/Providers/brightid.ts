// ----- Types
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types.js";
import type { RequestPayload, VerifiedPayload, BrightIdVerificationResponse } from "@gitcoin/passport-types";

// --- verifyMethod in providers
import { verifyBrightidContextId } from "../procedures/brightid.js";

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
      const errors = [];
      let record = undefined,
        valid = false;
      const did = payload.proofs?.did;

      const responseData = await verifyBrightidContextId(did || "");
      const validResponse: boolean = responseData.valid;
      const formattedData: BrightIdVerificationResponse = responseData?.result as BrightIdVerificationResponse;
      // Unique is true if the user obtained "Meets" verification by attending a connection party
      const isUnique = "unique" in formattedData && formattedData.unique === true;
      const firstContextId =
        "contextIds" in formattedData &&
        formattedData.contextIds &&
        formattedData.contextIds.length > 0 &&
        formattedData.contextIds[0];
      valid = firstContextId && isUnique;
      if (validResponse && valid) {
        record = {
          context: "context" in formattedData && formattedData.context,
          contextId: firstContextId,
          meets: JSON.stringify(isUnique),
        };
      } else if (!isUnique && firstContextId && !validResponse) {
        errors.push(
          `You have not met the BrightID verification requirements by attending a connection party -- isUnique: ${String(
            isUnique
          )} & firstContextId: ${firstContextId}`
        );
      } else if (!isUnique && !firstContextId && !validResponse) {
        errors.push("You have not met the BrightID verification requirements");
      }

      if (responseData.error) {
        errors.push(responseData.error);
      }

      return Promise.resolve({
        valid,
        record,
        errors,
      });
    } catch (e: unknown) {
      console.log(e);

      return Promise.reject(
        new ProviderExternalVerificationError(`Error verifying BrightID sponsorship: ${String(e)}`)
      );
    }
  }
}
