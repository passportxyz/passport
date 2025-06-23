import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { type Provider, type ProviderOptions } from "../../types.js";
import { initZkEmailSdk } from "@zk-email/sdk";
import { UBER_EMAIL } from "../procedures/mocked_email.js";

export class ZKEmailProvider implements Provider {
  type = "ZKEmail";
  _options: ProviderOptions;

  constructor(options: ProviderOptions = {}) {
    this._options = { ...options };
  }

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const record: { data?: string } | undefined = undefined;
    const errors: string[] = [];

    try {
      const sdk = initZkEmailSdk({});

      const blueprint = await sdk.getBlueprintById("85b4b54b-72c2-4a99-8393-7f8cc47332c8");

      const prover = await blueprint.createProver();
      const proof = await prover.generateProof(UBER_EMAIL);

      // google oauth
      // const accessToken = await requestAccessToken(payload.proofs.code);

      const publicData = proof.getProofData().publicData.toString();

      return {
        valid: true,
        errors,
        record: {
          data: publicData,
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
