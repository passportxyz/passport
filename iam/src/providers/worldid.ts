// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Credential verification
import { getAddress } from "../utils/signer";
import axios from "axios";

// API endpoint to verify World ID ZKP
const VERIFY_ENDPOINT = "https://developer.worldcoin.org/api/v1/verify";
// Static action ID to verify ZKP (should never change! for local testing, new IDs can be created in developer.worldcoin.org)
const ACTION_ID = "wid_staging_f03ce20272cf13e445a963c91a5695ea";

interface VerifyResponse {
  success: boolean;
  nullifier_hash: string;
}

// Export a World ID Provider that verifies a World ID ZKP with their API and returns a record object
export class WorldIDProvider implements Provider {
  // Give the provider a type so that we can select it from a payload
  type = "WorldID";
  // Options can be set here and/or via the constructor
  _options = {};

  // Construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address defined in the payload exists in the POH register
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    // Obtain address for signer to use as a signal for the ZKP
    const address = await getAddress(payload);

    // Attempt to verify ZKP with World ID API
    try {
      const response = await axios.post<VerifyResponse>(VERIFY_ENDPOINT, {
        nullifier_hash: payload.proofs.nullifier_hash,
        merkle_root: payload.proofs.merkle_root,
        proof: payload.proofs.proof,
        action_id: ACTION_ID,
        signal: address,
      });

      const valid = response.data.success;

      return {
        valid,
        record: valid
          ? {
              // Store the nullifier hash into the proof records
              nullifier_hash: payload.proofs.nullifier_hash,
            }
          : undefined,
      };
    } catch (e) {
      return {
        valid: false,
        error: [JSON.stringify(e)],
      };
    }
  }
}
