import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { type Provider, type ProviderOptions } from "../../types.js";
// Use dynamic import to avoid build-time slowness
// import { extractEMLDetails, initZkEmailSdk, Proof, RawEmailResponse, testBlueprint } from "@zk-email/sdk";
import { fetchEmailsRaw, fetchUserEmails, requestAccessToken } from "../procedures/gmail.js";

type Email = any & {
  valid: boolean;
};

export class ZKEmailProvider implements Provider {
  type = "ZKEmail";
  _options: ProviderOptions;

  constructor(options: ProviderOptions = {}) {
    this._options = { ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    console.log("payload: ", payload);
    const errors: string[] = [];
    const record: { data?: string } | undefined = undefined;

    try {
      // Validate payload structure
      if (!payload.proofs || !payload.proofs.uberProofs) {
        return {
          valid: false,
          errors: ["No uber proofs provided in payload"],
          record,
        };
      }

      const { initZkEmailSdk } = await import("@zk-email/sdk");
      const sdk = initZkEmailSdk({logging: {enabled: true, level: 'debug'}});
      
      const uberProofs = payload.proofs.uberProofs as unknown as string[];
      
      if (!Array.isArray(uberProofs) || uberProofs.length === 0) {
        return {
          valid: false,
          errors: ["Invalid or empty uber proofs array"],
          record,
        };
      }

      const proofs = await Promise.all(uberProofs.map((p: string) => sdk.unPackProof(p)));
      console.log("proofs: ", proofs);

      // count how many proofs are valid
      const validProofs = await Promise.all(
        proofs.map(async (proof: any) => {
          try {
            const verified = await proof.verify();
            return verified;
          } catch (err) {
            console.error("err during verify: ", err);
            return false;
          }
        })
      );
      console.log("validProofs: ", validProofs);
      const validProofCount = validProofs.filter((verified) => verified).length;
      console.log("validProofCount: ", validProofCount);

      if (validProofCount === 0) {
        return {
          valid: false,
          errors: ["No valid proofs found"],
          record,
        };
      }

      return {
        valid: true,
        errors,
        record: {
          totalProofs: validProofCount.toString(),
        },
      };
    } catch (error) {
      console.error("Error in ZKEmailProvider verify:", error);
      errors.push(`Failed to verify email: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        errors,
        record,
      };
    }
  }
}
