// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import qs from "qs";
import axios from "axios";
import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";

export type HumanodeOAuth2ServiceTokenResponse = {
  access_token: string;
};

// Export a Humanode Biometrics Liveness Check Provider to carry out OAuth2 and return a record object
export class BiometricsLivenessCheckProvider implements Provider {
  type = "BiometricsLivenessCheck";
  // Options can be set here and/or via the constructor
  _options = {};
  // The resolver for the remote JWKS.
  private JWKS;

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
    const accessTokenUrl = process.env.HUMANODE_OAUTH2_SERVICE_ACCESS_TOKEN_URL;

    this.JWKS = createRemoteJWKSet(new URL(accessTokenUrl + "/.well-known/jwks.json"));
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      verifiedPayload: JWTPayload | undefined;

    try {
      const accessToken = await requestAccessToken(payload.proofs.code, payload.proofs.state);
      verifiedPayload = (await jwtVerify(accessToken, this.JWKS)).payload;
    } catch (e) {
      return { valid: false };
    } finally {
      valid = Boolean(verifiedPayload?.sub);
    }

    return {
      valid: valid,
      record: {
        id: verifiedPayload?.sub,
      },
    };
  }
}

const requestAccessToken = async (code: string, state: string): Promise<string> => {
  const clientId = process.env.HUMANODE_OAUTH2_SERVICE_CLIENT_ID;
  const clientSecret = process.env.HUMANODE_OAUTH2_SERVICE_CLIENT_SECRET;
  const accessTokenUrl = process.env.HUMANODE_OAUTH2_SERVICE_ACCESS_TOKEN_URL;
  const redirectUri = process.env.HUMANODE_OAUTH2_SERVICE_CALLBACK;

  try {
    const data = {
      grant_type: "authorization_code",
      code,
      state,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    };

    const tokenRequest = await axios.post(accessTokenUrl + "/oauth2/token", qs.stringify(data), {
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });

    if (tokenRequest.status != 200) {
      throw `Unexpected response status code ${tokenRequest.status} for token request, expected 200`;
    }

    const tokenResponse = tokenRequest.data as HumanodeOAuth2ServiceTokenResponse;

    return tokenResponse.access_token;
  } catch (e: unknown) {
    const error = e as { response: { data: { error_description: string } } };
    // eslint-disable-next-line no-console
    console.error("Error when verifying humanode oauth2 service account for user:", error.response?.data);
    throw e;
  }
};
