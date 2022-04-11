// ----- Types
import type { Provider, ProviderOptions } from "../types";
import type { RequestPayload, VerifiedPayload } from "@dpopp/types";

// ----- OAuth2 library
import { OAuth2Client } from "google-auth-library";

// Use env provided client_id to establish OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Perform verification on shared google access token
async function verifyGoogle(idToken: string): Promise<{
  email: string;
  emailVerified: boolean;
}> {
  // verify the given token with google
  const ticket = await client.verifyIdToken({
    idToken: idToken,
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

// Export a Google Provider to carry out OAuth and return a record object
export class GoogleProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Google";
  // Options can be set here and/or via the constructor
  _options = {
    valid: "true",
  };

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload;

    try {
      verifiedPayload = await verifyGoogle(payload.proofs.idToken);
    } finally {
      valid = verifiedPayload && verifiedPayload.emailVerified ? true : false;
    }

    return {
      valid: valid,
      record: {
        email: verifiedPayload.email || "",
      },
    };
  }
}
