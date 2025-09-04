import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderInternalVerificationError, ProviderOptions } from "../../types.js";
import { getCleanHandsSPAttestationByAddress } from "@holonym-foundation/human-id-sdk";
import { isHexString, validateAttestation } from "../../HumanID/shared/utils.js";

export class CleanHandsProvider implements Provider {
  type = "CleanHands";

  constructor(_options: ProviderOptions = {}) {}

  async getAttestation(address: `0x${string}`) {
    try {
      return await getCleanHandsSPAttestationByAddress(address);
    } catch (e) {
      throw new ProviderInternalVerificationError(e.message);
    }
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    if (!isHexString(payload.address)) {
      return { valid: false, errors: ["Invalid address format"] };
    }

    const attestation = await this.getAttestation(payload.address);
    const result = validateAttestation(attestation);

    return {
      valid: result.valid,
      errors: !result.valid ? [`Clean Hands ${(result as any).error}`] : undefined,
      record: {
        id: attestation?.indexingValue,
      },
    };
  }
}
