// ----- Types
import type { RequestPayload, VerifiedPayload } from "@dpopp/types";

// ----- Github OAuth2
import { GithubFindMyUserResponse, requestFindMyUser } from "../procedures/githubOauth";
import type { Provider, ProviderOptions } from "../types";

// Export a Github Provider to carry out OAuth and return a record object
export class GithubProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Github";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: GithubFindMyUserResponse = {};

    try {
      verifiedPayload = await verifyGithub(payload.proofs.code);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.id ? true : false;
    }

    return {
      valid: valid,
      record: {
        id: verifiedPayload.id,
      },
    };
  }
}

// Perform verification on twitter access token
async function verifyGithub(code: string): Promise<GithubFindMyUserResponse> {
  return await requestFindMyUser(code);
}
