import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderOptions } from "../../types.js";
import { getCleanHandsSPAttestationByAddress } from "@holonym-foundation/human-id-sdk";
import { CLEAN_HANDS_CREDENTIAL_TYPE } from "../constants.js";
import { isHexString, validateAttestation } from "../../HumanID/shared/utils.js";

export class CleanHandsProvider implements Provider {
  type = "CleanHands";

  constructor(_options: ProviderOptions = {}) {}

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    if (!isHexString(payload.address)) {
      return { valid: false, errors: ["Invalid address format"] };
    }

    const attestation = await getCleanHandsSPAttestationByAddress(payload.address);
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
