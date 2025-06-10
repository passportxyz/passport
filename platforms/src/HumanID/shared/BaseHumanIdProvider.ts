import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderOptions, ProviderExternalVerificationError } from "../../types.js";
import { setOptimismRpcUrl } from "@holonym-foundation/human-id-sdk";

function isHexAddress(address: string): address is `0x${string}` {
  return address.startsWith("0x") && address.length === 42;
}

export abstract class BaseHumanIdProvider implements Provider {
  abstract type: string;
  abstract sbtFetcher: (
    address: string
  ) => Promise<{ expiry: bigint; publicValues: bigint[]; revoked: boolean } | null>;
  abstract credentialType: string;

  constructor(_options: ProviderOptions = {}) {}

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const rpcUrl = process.env.OPTIMISM_RPC_URL;
      if (!rpcUrl) {
        throw new Error("Optimism RPC URL not configured");
      }

      setOptimismRpcUrl(rpcUrl);

      // Validate address format
      if (!isHexAddress(payload.address)) {
        throw new Error("Invalid address format");
      }

      // Backend independently verifies the SBT exists
      const sbt = await this.sbtFetcher(payload.address);

      if (!sbt) {
        return {
          valid: false,
          errors: [`No ${this.credentialType} SBT found for this address`],
          record: undefined,
        };
      }

      // Check expiry
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (sbt.expiry <= currentTime) {
        return {
          valid: false,
          errors: [`${this.credentialType} SBT has expired`],
          record: undefined,
        };
      }

      // Check revocation
      if (sbt.revoked) {
        return {
          valid: false,
          errors: [`${this.credentialType} SBT has been revoked`],
          record: undefined,
        };
      }

      // Extract nullifier from public values (same position for both phone and KYC)
      if (!sbt.publicValues || !Array.isArray(sbt.publicValues) || sbt.publicValues.length < 2) {
        throw new ProviderExternalVerificationError("Invalid SBT public values");
      }

      const nullifier = sbt.publicValues[1].toString();

      return {
        valid: true,
        record: {
          nullifier,
        },
      };
    } catch (error: any) {
      throw new ProviderExternalVerificationError(
        `Error verifying Human ID ${this.credentialType} SBT: ${error.message}`
      );
    }
  }
}
