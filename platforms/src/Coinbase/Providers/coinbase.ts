// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider } from "../../types";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

export type CoinbaseTokenResponse = {
  access_token?: string;
};

export type CoinbaseUserData = {
  id?: string;
};

export type CoinbaseFindMyUserResponse = {
  data?: {
    data?: CoinbaseUserData;
  };
  status?: number;
};
export class CoinbaseProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "CoinbaseDualVerification";

  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let errors;
    let valid = false;

    const coinbaseAccountId = await verifyCoinbaseLogin(payload.proofs.code);
    if (coinbaseAccountId) {
      if (await verifyCoinbaseAttestation(payload.address)) {
        valid = true;
      } else {
        errors = [`We could not find a Coinbase-verified onchain attestation for your account: ${coinbaseAccountId}.`];
      }
    } else {
      errors = ["Coinbase user id was not found."];
    }

    return {
      valid,
      errors,
      record: { id: coinbaseAccountId },
    };
  }
}

export class CoinbaseProvider2 extends CoinbaseProvider {
  type = "CoinbaseDualVerification2";
}

export const requestAccessToken = async (code: string): Promise<string | undefined> => {
  const clientId = process.env.COINBASE_CLIENT_ID;
  const clientSecret = process.env.COINBASE_CLIENT_SECRET;
  const callback = process.env.COINBASE_CALLBACK;

  let tokenRequest: { data?: CoinbaseTokenResponse };
  try {
    // Used to format POST body as expected
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("code", code);
    params.append("redirect_uri", callback);

    // Exchange the code for an access token
    tokenRequest = await axios.post("https://api.coinbase.com/oauth/token", params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    });
  } catch (e) {
    console.log("error", e);
    handleProviderAxiosError(e, "Coinbase access token", [clientSecret, code]);
  }

  return tokenRequest?.data?.access_token;
};

export const verifyCoinbaseLogin = async (code: string): Promise<string | undefined> => {
  let userResponse: CoinbaseFindMyUserResponse;
  const accessToken = await requestAccessToken(code);

  try {
    // Now that we have an access token fetch the user details
    userResponse = await axios.get("https://api.coinbase.com/v2/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
  } catch (e) {
    handleProviderAxiosError(e, "Coinbase user info", [accessToken, code]);
  }

  return userResponse?.data?.data?.id;
};

const COINBASE_ATTESTER = "0x357458739F90461b99789350868CD7CF330Dd7EE";
export const BASE_EAS_SCAN_URL = "https://base.easscan.org/graphql";
export const VERIFIED_ACCOUNT_SCHEMA = "0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9";

export type Attestation = {
  recipient: string;
  revocationTime: number;
  revoked: boolean;
  expirationTime: number;
  schema: {
    id: string;
  };
};

export type EASQueryResponse = {
  data?: {
    data?: {
      attestations: Attestation[];
    };
  };
};

export const verifyCoinbaseAttestation = async (address: string): Promise<boolean> => {
  const query = `
    query {
      attestations (where: {
          attester: { equals: "${COINBASE_ATTESTER}" },
          recipient: { equals: "${address}", mode: insensitive }
      }) {
        recipient
        revocationTime
        revoked
        expirationTime
        schema {
          id
        }
      }
    }
  `;

  let result: EASQueryResponse;
  try {
    result = await axios.post(BASE_EAS_SCAN_URL, {
      query,
    });
  } catch (e) {
    handleProviderAxiosError(e, "Coinbase attestation", []);
  }

  return (
    (result?.data?.data?.attestations || []).filter(
      (attestation) =>
        attestation.revoked === false &&
        attestation.revocationTime === 0 &&
        attestation.expirationTime === 0 &&
        attestation.schema.id === VERIFIED_ACCOUNT_SCHEMA
    ).length > 0
  );
};
