// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../types";
import { requestAccessToken } from "./github";
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubFindMyUserResponse = {
  id?: string;
  login?: string;
  type?: string;
};

type GHUserRequestPayload = RequestPayload & {
  org?: string;
};

type GithubMyOrg = {
  providedOrg: string;
  matchingOrg: string;
};

type GHVerification = {
  validOrg: GithubMyOrg;
  handle: string;
};

// Export a Github Provider to carry out OAuth and return a record object
export class GithubOrgProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "GithubOrg";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the Github user is a memeber of the provided organization
  async verify(payload: GHUserRequestPayload): Promise<VerifiedPayload> {
    let valid = false,
      ghVerification: GHVerification;

    try {
      ghVerification = await verifyGithub(payload.proofs.code, payload.org);
    } catch (e) {
      return { valid: false };
    } finally {
      const validOrg = ghVerification?.validOrg;
      valid = validOrg && validOrg.matchingOrg === validOrg.providedOrg;
    }

    return {
      valid: valid,
      record: {
        org: ghVerification.validOrg.matchingOrg,
        handle: ghVerification.handle,
      },
    };
  }
}

type GithubUserResponse = {
  status: number;
  data: {
    login: string;
  };
};

type Organization = {
  login: string;
};

type GithubUserOrgResponse = {
  status: number;
  data: Organization[];
};

const verifyOrg = (data: Organization[], providedOrg: string): GithubMyOrg => {
  const orgs = data;
  const matchingOrgs = orgs.filter((org) => org.login === providedOrg);

  if (matchingOrgs.length !== 1) {
    throw `${providedOrg} not found in user profile`;
  }
  return {
    providedOrg,
    matchingOrg: matchingOrgs[0].login,
  };
};

const verifyGithub = async (code: string, providedOrg: string): Promise<GHVerification> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  // Now that we have an access token fetch the user details
  const userRequest: GithubUserResponse = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });
  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }

  const handle = userRequest.data.login;

  const userOrgRequest: GithubUserOrgResponse = await axios.get(`https://api.github.com/users/${handle}/orgs`, {
    headers: { Authorization: `token ${accessToken}` },
  });

  if (userOrgRequest.status != 200) {
    throw `Get user org request returned status code ${userOrgRequest.status} instead of the expected 200`;
  }

  const validOrg = verifyOrg(userOrgRequest.data, providedOrg);
  return {
    validOrg,
    handle,
  };
};
