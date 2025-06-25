import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { type Provider, type ProviderOptions } from "../../types.js";
import { extractEMLDetails, initZkEmailSdk, Proof, RawEmailResponse, testBlueprint } from "@zk-email/sdk";
import { UBER_EMAIL } from "../procedures/mocked_email.js";
import { fetchEmailsRaw, fetchUserEmails, requestAccessToken } from "../procedures/gmail.js";

type Email = RawEmailResponse & {
  valid: boolean;
};

export class ZKEmailProvider implements Provider {
  type = "ZKEmail";
  _options: ProviderOptions;

  constructor(options: ProviderOptions = {}) {
    this._options = { ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const record: { data?: string } | undefined = undefined;
    const errors: string[] = [];

    const proofs = JSON.parse(payload.proofs.uberProofs) as Proof[];

    try {
      const sdk = initZkEmailSdk({});

      const blueprint = await sdk.getBlueprintById("85b4b54b-72c2-4a99-8393-7f8cc47332c8");

      // count how many proofs are valid
      const validProofs = await Promise.all(
        proofs.map(async (proof) => {
          const verified = await blueprint.verifyProof(proof);
          return verified;
        })
      );
      const validProofCount = validProofs.filter((verified) => verified).length;

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
