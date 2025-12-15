import { RequestPayload, IssuedChallenge, CredentialResponseBody, ValidResponseBody } from "@gitcoin/passport-types";

// --- Node/Browser http req library
import axios, { AxiosError } from "axios";

// Fetch a verifiable challenge credential (legacy flow)
export const fetchChallengeCredential = async (iamUrl: string, payload: RequestPayload): Promise<IssuedChallenge> => {
  // fetch challenge as a credential from API that fits the version, address and type (this credential has a short ttl)
  const response: { data: CredentialResponseBody } = await axios.post(
    `${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/challenge`,
    {
      payload: {
        address: payload.address,
        type: payload.type,
        // if an alt signer is being added pass it in to be included in the challenge string
        signatureType: payload.signatureType,
      },
    }
  );

  const data = response.data;

  if ("error" in data && data.error) {
    console.error("Error fetching challenge credential", data.error);
    throw new Error("Unable to fetch challenge credential");
  } else {
    return {
      challenge: (data as ValidResponseBody).credential,
    } as IssuedChallenge;
  }
};

/**
 * Fetch verifiable credentials from IAM
 *
 * Supports two authentication modes:
 * 1. JWT auth (preferred): Pass dbAccessToken from SIWE authentication - no wallet signature needed
 * 2. Legacy challenge auth: Pass signer function for per-request wallet signatures
 *
 * @param iamUrl - IAM service URL
 * @param payload - Request payload with provider types
 * @param auth - Either JWT token string OR signer function for legacy flow
 */
export const fetchVerifiableCredential = async (
  iamUrl: string,
  payload: RequestPayload,
  auth: string | ((message: string) => Promise<string>)
): Promise<{ credentials: CredentialResponseBody[] }> => {
  // JWT authentication flow (new SIWE-based)
  if (typeof auth === "string") {
    const response: { data: CredentialResponseBody | CredentialResponseBody[] } = await axios.post(
      `${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/verify`,
      { payload },
      {
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      }
    );

    return {
      credentials: Array.isArray(response.data) ? response.data : [response.data],
    };
  }

  // Legacy challenge-based authentication flow
  const signer = auth;

  // first pull a challenge that can be signed by the user
  const { challenge } = await fetchChallengeCredential(iamUrl, payload);

  // sign the challenge provided by the IAM using wallet signature
  const challengeMessage = challenge.credentialSubject.challenge;
  if (!challengeMessage) {
    throw new Error("No challenge provided");
  }

  const signature = await signer(challengeMessage);

  // must provide signature for message
  if (!signature) {
    throw new Error("Unable to sign message");
  }

  // fetch a credential from the API that fits the version, payload and passes the signature message challenge
  const response: { data: CredentialResponseBody | CredentialResponseBody[] } = await axios.post(
    `${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/verify`,
    {
      payload,
      challenge,
      signedChallenge: signature,
    }
  );

  // return everything that was used to create the credential (along with the credential)
  return {
    credentials: Array.isArray(response.data) ? response.data : [response.data],
  };
};

/**
 * Fetch verifiable credentials with resilient authentication
 *
 * Tries JWT authentication first (no wallet popup), falls back to challenge-based
 * auth if JWT fails. This allows safe deployment regardless of IAM version.
 *
 * TODO: Remove fallback once IAM JWT support is fully deployed and stable.
 * Track: https://github.com/passportxyz/passport/issues/XXXX
 *
 * @param iamUrl - IAM service URL
 * @param payload - Request payload with provider types
 * @param dbAccessToken - JWT token from SIWE authentication
 * @param signMessage - Fallback signer function for legacy challenge flow
 */
export const fetchVerifiableCredentialWithFallback = async (
  iamUrl: string,
  payload: RequestPayload,
  dbAccessToken: string | undefined,
  signMessage: (message: string) => Promise<string>
): Promise<{ credentials: CredentialResponseBody[] }> => {
  // Try JWT authentication first (preferred - no wallet popup)
  if (dbAccessToken) {
    try {
      return await fetchVerifiableCredential(iamUrl, payload, dbAccessToken);
    } catch (error) {
      // If auth error (401), fall back to challenge-based auth
      // Other errors should propagate
      const isAuthError = error instanceof AxiosError && error.response?.status === 401;
      if (!isAuthError) {
        throw error;
      }
      console.warn("JWT authentication failed, falling back to challenge-based auth");
    }
  }

  // Fallback to challenge-based authentication (legacy flow with wallet popup)
  return await fetchVerifiableCredential(iamUrl, payload, signMessage);
};
