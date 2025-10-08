import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import {
  Provider,
  ProviderOptions,
  ProviderExternalVerificationError,
  ProviderInternalVerificationError,
} from "../../types.js";
import { setOptimismRpcUrl } from "@holonym-foundation/human-id-sdk";
import { validateSbt, isAddress } from "./utils.js";

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

  _validateSbt(sbt: any) {
    const result = validateSbt(sbt);

    if (!result.valid) {
      return {
        valid: false,
        errors: [`${this.credentialType} ${(result as any).error}`],
      };
    }

    return { valid: true };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const rpcUrl = process.env.OPTIMISM_RPC_URL;
    if (!rpcUrl) {
      throw new ProviderInternalVerificationError("Optimism RPC URL not configured");
    }

    setOptimismRpcUrl(rpcUrl);

    // Validate address format
    if (!isAddress(payload.address)) {
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
