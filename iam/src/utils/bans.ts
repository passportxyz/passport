// ---- Types
import { CredentialResponseBody, ValidResponseBody } from "@gitcoin/passport-types";

// All provider exports from platforms
import { handleAxiosError } from "@gitcoin/passport-platforms";
import { UnexpectedApiError } from "./helpers.js";
import axios from "axios";

const SCORER_ENDPOINT = process.env.SCORER_ENDPOINT;
const SCORER_API_KEY = process.env.SCORER_API_KEY;

type Ban = {
  credential_id: string;
  is_banned: boolean;
  end_time?: string;
  ban_type?: "account" | "hash" | "single_stamp";
  reason?: string;
};

export const checkCredentialBans = async (
  credentialResponses: CredentialResponseBody[]
): Promise<CredentialResponseBody[]> => {
  const credentialsToCheck = credentialResponses.filter((credentialResponse): credentialResponse is ValidResponseBody =>
    Boolean((credentialResponse as ValidResponseBody).credential)
  );

  const payload = credentialsToCheck.map(({ credential }, index) => {
    const { hash, provider, address } = credential.credentialSubject;
    return {
      credential_id: index.toString(),
      credentialSubject: {
        hash,
        provider,
        address,
      },
    };
  });

  const bans = (await fetchBans(payload)).sort((a, b) => parseInt(a.credential_id) - parseInt(b.credential_id));

  return credentialResponses.map((credentialResponse) => {
    if (!(credentialResponse as ValidResponseBody).credential) {
      return credentialResponse;
    }

    const ban = bans.shift();
    if (ban && ban.is_banned) {
      return {
        error: `Credential is banned.
                Type: ${ban.ban_type}
                Reason: ${ban.reason}
                End time: ${ban.end_time || "(indefinite)"}`.replace(/^\s+/gm, ""),
        code: 403,
      };
    }

    return credentialResponse;
  });
};

const fetchBans = async (
  payload: { credential_id: string; credentialSubject: { hash: string; provider: string; address: string } }[]
): Promise<Ban[]> => {
  if (!payload.length) {
    return [];
  }

  try {
    const banResponse: {
      data?: Ban[];
    } = await axios.post(`${SCORER_ENDPOINT}/ceramic-cache/check-bans`, payload, {
      headers: {
        Authorization: SCORER_API_KEY,
      },
    });

    const bans = (banResponse.data || []).sort((a, b) => parseInt(a.credential_id) - parseInt(b.credential_id));

    return bans;
  } catch (e) {
    handleAxiosError(e, "Bans", UnexpectedApiError, [SCORER_API_KEY]);
  }
};
