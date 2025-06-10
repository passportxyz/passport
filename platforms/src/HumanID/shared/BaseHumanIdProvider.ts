import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import {
  Provider,
  ProviderOptions,
  ProviderExternalVerificationError,
  ProviderInternalVerificationError,
} from "../../types.js";
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

  async getExistingSbt(address: string): Promise<{ expiry: bigint; publicValues: bigint[]; revoked: boolean } | null> {
    try {
      return await this.sbtFetcher(address);
    } catch {
      /* Throws when SBT not found */
    }
  }

  _validateSbt(sbt: {
    expiry: bigint;
    publicValues: bigint[];
    revoked: boolean;
  }): { valid: true; errors?: undefined } | { valid: false; errors: string[] } {
    if (!sbt) {
      return {
        valid: false,
        errors: [`No ${this.credentialType} SBT found for this address`],
      };
    }

    // Check expiry
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    if (sbt.expiry <= currentTime) {
      return {
        valid: false,
        errors: [`${this.credentialType} SBT has expired`],
      };
    }

    // Check revocation
    if (sbt.revoked) {
      return {
        valid: false,
        errors: [`${this.credentialType} SBT has been revoked`],
      };
    }

    // Extract nullifier from public values
    if (!sbt.publicValues || !Array.isArray(sbt.publicValues) || sbt.publicValues.length < 5) {
      throw new ProviderExternalVerificationError("Invalid SBT public values");
    }

    return {
      valid: true,
    };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const rpcUrl = process.env.OPTIMISM_RPC_URL;
    if (!rpcUrl) {
      throw new ProviderInternalVerificationError("Optimism RPC URL not configured");
    }

    setOptimismRpcUrl(rpcUrl);

    // Validate address format
    if (!isHexAddress(payload.address)) {
      throw new ProviderInternalVerificationError("Invalid address format");
    }

    const sbt = await this.getExistingSbt(payload.address);

    const { valid, errors } = this._validateSbt(sbt);

    return {
      valid,
      errors,
      record: {
        // Public Values: [expiry, recipientAddress, actionId, nullifier, issuerAddress]
        nullifier: sbt?.publicValues?.[3]?.toString(),
      },
    };
  }
}
