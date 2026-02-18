import { RequestPayload, CredentialResponseBody } from "@gitcoin/passport-types";

// --- Node/Browser http req library
import axios from "axios";

/**
 * Fetch verifiable credentials from IAM using JWT authentication (SIWE-based).
 *
 * @param iamUrl - IAM service URL
 * @param payload - Request payload with provider types
 * @param dbAccessToken - JWT token from SIWE authentication
 */
export const fetchVerifiableCredential = async (
  iamUrl: string,
  payload: RequestPayload,
  dbAccessToken: string
): Promise<{ credentials: CredentialResponseBody[] }> => {
  const response: { data: CredentialResponseBody | CredentialResponseBody[] } = await axios.post(
    `${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/verify`,
    { payload },
    {
      headers: {
        Authorization: `Bearer ${dbAccessToken}`,
      },
    }
  );

  return {
    credentials: Array.isArray(response.data) ? response.data : [response.data],
  };
};
