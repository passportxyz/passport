import axios from "axios";
import { ProviderError } from "../../utils/errors.js";
import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types.js";
import { getErrorString } from "../../utils/errors.js";

type GoogleTokenResponse = {
  access_token: string;
};

type GmailMessagesListResponse = {
  messages: Array<{
    id: string;
    threadId: string;
  }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export const requestAccessToken = async (code: string): Promise<string> => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK;

  try {
    const url = `https://oauth2.googleapis.com/token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code&redirectUri=${redirectUri}`;

    // Exchange the code for an access token
    const tokenRequest = await axios.post(
      url,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    const tokenResponse = tokenRequest.data as GoogleTokenResponse;

    return tokenResponse.access_token;
  } catch (_error) {
    const error = _error as ProviderError;
    const errorString = getErrorString(error);
    throw new ProviderExternalVerificationError(errorString);
  }
};

// TODO: Implement a function to fetch emails from Gmail API
export const fetchUserEmails = async (
  accessToken: string,
  queryParams: Record<string, string>
): Promise<GmailMessagesListResponse> => {
  const params = new URLSearchParams({
    maxResults: "20",
    pageToken: "0",
    ...queryParams,
  });

  const url = `https://www.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data as GmailMessagesListResponse;
  } catch (_error) {
    const error = _error as ProviderError;
    const errorString = getErrorString(error);
    throw new ProviderExternalVerificationError(errorString);
  }
};
