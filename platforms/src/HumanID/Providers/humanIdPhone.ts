import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, Provider, ProviderOptions } from "../../types.js";
import * as humanIdSdk from "@holonym-foundation/human-id-sdk";

export class HumanIdPhoneProvider implements Provider {
  type = "HumanIdPhone";

  constructor(options: ProviderOptions = {}) {}

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL;
      if (!rpcUrl) {
        throw new ProviderExternalVerificationError("Optimism RPC URL not configured");
      }

      // Set the RPC URL for the Human ID SDK
      humanIdSdk.setOptimismRpcUrl(rpcUrl);

      // Query for the phone SBT
      const result = await humanIdSdk.getPhoneSBTByAddress(payload.address);

      if (!result) {
        return {
          valid: false,
          errors: ["No phone SBT found for this address"],
          record: undefined,
        };
      }

      // Extract nullifier from publicValues[1]
      const [expiry, publicValues, revoked] = result;
      const nullifier = publicValues[1];

      return {
        valid: true,
        record: {
          nullifier,
        },
      };
    } catch (error: any) {
      throw new ProviderExternalVerificationError(`Error verifying Human ID phone SBT: ${error.message}`);
    }
  }
}
