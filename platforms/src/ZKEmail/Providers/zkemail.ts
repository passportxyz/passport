import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { type Provider, type ProviderOptions } from "../../types.js";
import { extractEMLDetails, initZkEmailSdk, RawEmailResponse, testBlueprint } from "@zk-email/sdk";
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

    const googleAuthToken = await requestAccessToken(payload.proofs.code);

    try {
      const sdk = initZkEmailSdk({});

      const blueprint = await sdk.getBlueprintById("85b4b54b-72c2-4a99-8393-7f8cc47332c8");

      const emailListResponse = await fetchUserEmails(googleAuthToken, { q: "from:uber.com" });

      if (emailListResponse.messages.length === 0) {
        throw new Error("No emails found");
      }

      const emailResponseMessages = emailListResponse.messages;

      const emailIds = emailResponseMessages.map((message) => message.id);
      const emails = await fetchEmailsRaw(googleAuthToken, emailIds);

      const validatedEmails: {
        email: RawEmailResponse;
        senderDomain: string;
        selector: string;
      }[] = await Promise.all(
        emails.map(async (email) => {
          const { senderDomain, selector } = await extractEMLDetails(email.decodedContents);
          return {
            email,
            senderDomain,
            selector,
          };
        })
      );

      // Process validation for all emails
      // const processedEmails: Email[] = await Promise.all(
      //   validatedEmails.map(async ({ email }) => {
      //     const validationResult = await testBlueprint(email.decodedContents, blueprint.props);
      //     return {
      //       ...email,
      //       valid: validationResult.length > 0,
      //     };
      //   })
      // );

      // const prover = await blueprint.createProver();
      // const proof = await prover.generateProof(UBER_EMAIL);

      // google oauth
      // const accessToken = await requestAccessToken(payload.proofs.code);

      // const publicData = proof.getProofData().publicData.toString();

      return {
        valid: true,
        errors,
        record: {
          validEmails: validatedEmails.length.toString(),
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
