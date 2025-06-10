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
      const rpcUrl = process.env.OPTIMISM_RPC_URL;
      if (!rpcUrl) {
        throw new Error("Optimism RPC URL not configured");
      }

      setOptimismRpcUrl(rpcUrl);

      // Query for phone SBT
      if (!isHexAddress(payload.address)) {
        throw new Error("Invalid address format");
      }
      const phoneSbt = await getPhoneSBTByAddress(payload.address);

      console.log("🔍 HumanID Phone SBT Query Result:", phoneSbt);
      console.log("🔍 SBT Type:", typeof phoneSbt);
      console.log("🔍 SBT Keys:", phoneSbt ? Object.keys(phoneSbt) : "null");

      if (!phoneSbt) {
        console.log("❌ No phone SBT found for address:", payload.address);
        return {
          valid: false,
          errors: ["No phone SBT found for this address"],
          record: undefined,
        };
      }

      let nullifier: string | undefined;

      // Handle new object structure: { expiry: bigint, publicValues: bigint[], revoked: boolean }
      if (phoneSbt && typeof phoneSbt === "object" && "publicValues" in phoneSbt) {
        const publicValues = phoneSbt.publicValues;
        console.log("🔍 Public Values:", publicValues);
        console.log("🔍 Public Values Length:", Array.isArray(publicValues) ? publicValues.length : "not array");

        if (Array.isArray(publicValues) && publicValues.length >= 2) {
          const nullifierValue = publicValues[1];
          nullifier = nullifierValue.toString();
          console.log("✅ Extracted nullifier:", nullifier);
        } else {
          console.log("❌ Public values array too short or not array:", publicValues);
        }
      } else {
        console.log("❌ SBT object structure unexpected:", phoneSbt);
      }

      if (!nullifier) {
        console.log("❌ Unable to determine nullifier from phone SBT");
        throw new ProviderExternalVerificationError("Unable to determine nullifier from phone SBT");
      }

      console.log("✅ HumanID Phone verification successful for address:", payload.address);
      console.log("✅ Final nullifier:", nullifier);

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
