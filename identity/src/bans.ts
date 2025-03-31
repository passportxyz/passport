import { CredentialResponseBody, ValidResponseBody, VerifiableCredential } from "@gitcoin/passport-types";
import { handleAxiosError } from "@gitcoin/passport-platforms";
import axios from "axios";
import { ApiError, InternalApiError } from "./serverUtils/apiError.js";

const SCORER_ENDPOINT = process.env.SCORER_ENDPOINT;
const SCORER_API_KEY = process.env.SCORER_API_KEY;

type Ban = {
  hash: string;
  is_banned: boolean;
  end_time?: string;
  ban_type?: "account" | "hash" | "single_stamp";
  reason?: string;
};

export const checkCredentialBans = async (
  credentialResponses: CredentialResponseBody[]
): Promise<CredentialResponseBody[]> => {
  const credentialsToCheck = credentialResponses
    .filter((credentialResponse): credentialResponse is ValidResponseBody =>
      Boolean((credentialResponse as ValidResponseBody).credential)
    )
    .map(({ credential }) => credential);

  const bans = await fetchBans(credentialsToCheck);
  const bansByHash = bans.reduce(
    (acc, ban) => {
      acc[ban.hash] = ban;
      return acc;
    },
    {} as Record<string, Ban>
  );

  return credentialResponses.map((credentialResponse) => {
    const credential = (credentialResponse as ValidResponseBody).credential;
    if (!credential) {
      return credentialResponse;
    }

    const { nullifiers, hash } = credential.credentialSubject;
    // TODO Support for legacy format, can remove
    // once fully migrated
    const nullifiersToCheck = nullifiers || [hash];

    for (const nullifier of nullifiersToCheck) {
      const ban = bansByHash[nullifier];

      if (!ban) {
        throw new ApiError(`Ban not found for nullifier ${nullifier}. This should not happen.`, "500_SERVER_ERROR");
      }

      if (ban.is_banned) {
        return {
          error:
            `Credential is banned. Type=${ban.ban_type}, End=${ban.end_time || "indefinite"},` +
            (ban.reason ? ` Reason=${ban.reason}` : ""),
          code: 403,
        };
      }
    }

    return credentialResponse;
  });
};

const fetchBans = async (credentials: VerifiableCredential[]): Promise<Ban[]> => {
  if (!credentials.length) {
    return [];
  }

  const payload: {
    credentialSubject: { provider: string; id: string; hash: string };
  }[] = [];

  credentials.forEach((credential) => {
    const { nullifiers, provider, id, hash } = credential.credentialSubject;

    // TODO Support for legacy format, can remove
    // once fully migrated
    const nullifiersToCheck = nullifiers || [hash];

    nullifiersToCheck.forEach((nullifier) => {
      payload.push({
        credentialSubject: {
          provider,
          id,
          // TODO do we want to modify this payload to expect "nullifier" or "nullifiers" instead of "hash"?
          hash: nullifier,
        },
      });
    });
  });

  try {
    const banResponse: {
      data?: Ban[];
    } = await axios.post(`${SCORER_ENDPOINT}/internal/check-bans`, payload, {
      headers: {
        Authorization: SCORER_API_KEY,
      },
    });

    return banResponse.data || [];
  } catch (e) {
    handleAxiosError(e, "Bans", InternalApiError, [SCORER_API_KEY]);
  }
};
