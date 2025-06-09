import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderOptions, ProviderExternalVerificationError } from "../../types.js";
import { setOptimismRpcUrl, getPhoneSBTByAddress } from "@holonym-foundation/human-id-sdk";

function isHexAddress(address: string): address is `0x${string}` {
  return address.startsWith("0x") && address.length === 42;
}

export class HumanIdPhoneProvider implements Provider {
  type = "HumanIdPhone";

  constructor(_options: ProviderOptions = {}) {}

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL;
      if (!rpcUrl) {
        throw new Error("Optimism RPC URL not configured");
      }

      setOptimismRpcUrl(rpcUrl);

      // Query for phone SBT
      if (!isHexAddress(payload.address)) {
        throw new Error("Invalid address format");
      }
      const phoneSbt = await getPhoneSBTByAddress(payload.address);

      if (!phoneSbt) {
        return {
          valid: false,
          errors: ["No phone SBT found for this address"],
          record: undefined,
        };
      }

      let nullifier: string | undefined;

      if (Array.isArray(phoneSbt) && phoneSbt.length >= 2) {
        const publicValues = phoneSbt[1];
        if (Array.isArray(publicValues) && publicValues.length >= 2) {
          const nullifierValue = publicValues[1];
          nullifier = nullifierValue.toString();
        }
      }

      if (!nullifier) {
        throw new ProviderExternalVerificationError("Unable to determine nullifier from phone SBT");
      }

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
