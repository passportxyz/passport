import { type Provider, type ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import axios from "axios";
 
type OutdidVerification = {
  uniqueID: string,
  verificationName: string,
  status: string,
  parameters: { uniqueness: boolean },
}

export class OutdidProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "Outdid";
 
  // Options can be set here and/or via the constructor
  _options: ProviderOptions = {};
 
  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }
 
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let id = "";
    const errors: string[] = [];
    try {
      const requestID = payload.proofs?.requestID;

      const verificationData: OutdidVerification = await axios.get(`https://api.outdid.io/verification-request?requestID=${requestID}`)
        .then((response: {data: OutdidVerification}) => response.data);

      id = verificationData.uniqueID;
      const did = verificationData.verificationName;
      if (did === undefined || did === "" || did !== payload.proofs?.userDid) {
        errors.push("User verification with Outdid failed.");
      } else if (id === undefined || id === "" || JSON.stringify(verificationData.parameters) !== JSON.stringify({ uniqueness: true })) {
        errors.push("User could not be verified");
      } else {
        valid = (verificationData.status === "succeeded");
      }
    } catch (e) {
      errors.push("Error verifying identity with Outdid: " + String(e));
      valid = false;
    }

    return {
      valid,
      errors,
      record: { id },
    };
  }
}