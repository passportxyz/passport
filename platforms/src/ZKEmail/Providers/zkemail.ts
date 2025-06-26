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
    const { initZkEmailSdk  } = await import("@zk-email/sdk");
    const sdk = initZkEmailSdk({logging: {enabled: true, level: 'debug'}});
    
    const record: { data?: string } | undefined = undefined;
    const errors: string[] = [];

    const proofs = await Promise.all((payload.proofs.uberProofs as unknown as string[]).map((p: string) => sdk.unPackProof(p)));
    console.log("proofs: ", proofs);

    try {
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

      return {
        valid: true,
        errors,
        record: {
          totalProofs: validProofCount.toString(),
        },
      };
    } catch (error) {
      errors.push(`Failed to verify email: ${error instanceof Error ? error.message : String(error)}`);
      return {
        valid: false,
        errors,
        record,
      };
    }
  }
}
