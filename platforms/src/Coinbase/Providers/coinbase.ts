// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { type Provider, type ProviderOptions } from "../../types";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

export type CoinbaseTokenResponse = {
  access_token: string;
};

export type CoinbaseUserData = {
  id: string;
};

export type CoinbaseFindMyUserResponse = {
  data?: {
    data: CoinbaseUserData;
  };
  status: number;
};

export class CoinbaseProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "Coinbase";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    try {
      const errors = [];
      let coinbaseAccountId = "",
        record = undefined;

      coinbaseAccountId = await verifyCoinbaseLogin(payload.proofs.code);

      const verifiedCoinbaseAttestation = await verifyCoinbaseAttestation(payload.address);

      if (verifiedCoinbaseAttestation) {
        record = {
          id: coinbaseAccountId,
        };
      } else {
        errors.push(
          `We could not find a Coinbase-verified onchain attestation for your account: ${coinbaseAccountId}.`
        );
      }

      return {
        valid: true,
        errors,
        record,
      };
    } catch (e: unknown) {
      return {
        valid: false,
        record: undefined,
        errors: [String(e)],
      };
    }
  }
}

export const requestAccessToken = async (code: string): Promise<string> => {
  const clientId = process.env.COINBASE_CLIENT_ID;
  const clientSecret = process.env.COINBASE_CLIENT_SECRET;
  const callback = process.env.COINBASE_CALLBACK;

  // Exchange the code for an access token
  const tokenRequest = await axios.post(
    `https://api.coinbase.com/oauth/token?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${callback}`,
    {},
    {
      headers: { Accept: "application/json" },
    }
  );

  if (tokenRequest.status != 200) {
    throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
  }

  const tokenResponse = tokenRequest.data as CoinbaseTokenResponse;

  return tokenResponse.access_token;
};

export const verifyCoinbaseLogin = async (code: string): Promise<string> => {
  let userResponse: CoinbaseFindMyUserResponse;
  try {
    // retrieve user's auth bearer token to authenticate client
    const accessToken = await requestAccessToken(code);

    // Now that we have an access token fetch the user details
    userResponse = await axios.get("https://api.coinbase.com/v2/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (userResponse.status != 200) {
      throw `Get user request returned status code ${userResponse.status} instead of the expected 200`;
    }
  } catch (e) {
    const error = e as {
      response: {
        data: {
          error_description: string;
        };
      };
      request: string;
      message: string;
    };
    handleProviderAxiosError(error, "Coinbase access token request error", [code]);
  }

  const userData = userResponse.data;

  if (!userData.data || !userData.data.id) {
    throw "Coinbase user id was not found.";
  }
  return userData.data.id;
};

const COINBASE_ATTESTER = "0x357458739F90461b99789350868CD7CF330Dd7EE";
const baseEASScanUrl = "https://base.easscan.org/graphql";

export type Attestation = {
  recipient: string;
  revocationTime: number;
  revoked: boolean;
  expirationTime: number;
};

export type EASQueryResponse = {
  data: {
    attestations: Attestation[];
  };
};

export const verifyCoinbaseAttestation = async (address: string): Promise<boolean> => {
  const query = `
  query CoinbaseAttestation {
    attestations (where: {
      attester: { equals: ${COINBASE_ATTESTER} },
      recipient: { equals: ${address} }
    }) {
      recipient
      revocationTime
      revoked
      expirationTime
    }
  }
  `;
  const result: EASQueryResponse = await axios.post(baseEASScanUrl, {
    query,
  });

  return (
    result.data.attestations.filter(
      (attestation) =>
        attestation.revoked === false &&
        attestation.revocationTime === 0 &&
        attestation.expirationTime > Date.now() / 1000
    ).length > 0
  );
};
