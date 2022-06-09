// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Googles OAuth2 library
import { OAuth2Client } from "google-auth-library";

// Use env provided client_id to establish OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Checking a valid tokenId for a result from Google will result in the following type
type GoogleResponse = {
  email?: string;
  emailVerified?: boolean;
};

// Export a Google Provider to carry out OAuth and return a record object
export class GoogleProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Google";
  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: GoogleResponse = {};

    try {
      verifiedPayload = await verifyGoogle(payload.proofs.tokenId);
    } catch (e) {
      return { valid: false };
    } finally {
      valid = verifiedPayload && verifiedPayload.emailVerified ? true : false;
    }

    return {
      valid: valid,
      record: {
        email: verifiedPayload.email,
      },
    };
  }
}

// Perform verification on shared google access token
async function verifyGoogle(tokenId: string): Promise<GoogleResponse> {
  // verify the given token with google
  const ticket = await client.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  // fetch the tokens access details
  const payload = ticket.getPayload();

  // details that we care about...
  const email = payload["email"];
  const emailVerified = payload["email_verified"];

  return {
    email,
    emailVerified,
  };
}
