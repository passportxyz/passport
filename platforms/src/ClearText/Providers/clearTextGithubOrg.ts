// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types.js";
import axios from "axios";

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubFindMyUserResponse = {
  id?: string;
  login?: string;
  type?: string;
};

export enum ClientType {
  GrantHub = 0,
  GrantHubMACI = 1,
}

export type GHUserRequestPayload = RequestPayload & {
  requestedClient: ClientType;
  org?: string;
};

type GithubMyOrg = {
  providedOrg: string;
  matchingOrg: string;
};

type GHVerification = {
  validOrg: GithubMyOrg;
  id: number;
};

// Export a Github Provider to carry out OAuth and return a record object
export class ClearTextGithubOrgProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "ClearTextGithubOrg";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // verify that the Github user is a memeber of the provided organization
  async verify(_payload: RequestPayload): Promise<VerifiedPayload> {
    // TODO: geri review this
    const payload = _payload as GHUserRequestPayload;
    let valid = false,
      ghVerification: GHVerification,
      pii;
    try {
      ghVerification = await verifyGithub(payload.proofs.code, payload.org, payload.requestedClient);
    } catch (e) {
      return { valid: false };
    } finally {
      const validOrg = ghVerification?.validOrg;
      pii = validOrg ? `${validOrg.matchingOrg}#${ghVerification.id}` : "";
      valid = validOrg && validOrg.matchingOrg === validOrg.providedOrg;
    }

    return {
      valid: valid,
      record: {
        pii,
      },
    };
  }
}

type GithubUserResponse = {
  status: number;
  data: {
    login: string;
    id: number;
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

const getCredentials = (requestedClient: ClientType): { clientId: string; clientSecret: string } => {
  switch (requestedClient) {
    case ClientType.GrantHub:
      return {
        clientId: process.env.GRANT_HUB_GITHUB_CLIENT_ID,
        clientSecret: process.env.GRANT_HUB_GITHUB_CLIENT_SECRET,
      };
    case ClientType.GrantHubMACI:
      return {
        clientId: process.env.GRANT_HUB_MACI_GITHUB_CLIENT_ID,
        clientSecret: process.env.GRANT_HUB_MACI_GITHUB_CLIENT_SECRET,
      };
  }
  return {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
};

const requestAccessToken = async (code: string, requestedClient: ClientType): Promise<string> => {
  const { clientId, clientSecret } = getCredentials(requestedClient);

  // Exchange the code for an access token
  const tokenRequest = await axios.post(
    `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
    {},
    {
      headers: { Accept: "application/json" },
    }
  );

  if (tokenRequest.status != 200) {
    throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
  }

  const tokenResponse = tokenRequest.data as GithubTokenResponse;

  return tokenResponse.access_token;
};

const verifyGithub = async (
  code: string,
  providedOrg: string,
  requestedClient: ClientType
): Promise<GHVerification> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code, requestedClient);

  // Now that we have an access token fetch the user details
  const userRequest: GithubUserResponse = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });
  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }

  const handle = userRequest.data.login;
  const { id } = userRequest.data;

  const userOrgRequest: GithubUserOrgResponse = await axios.get(`https://api.github.com/users/${handle}/orgs`, {
    headers: { Authorization: `token ${accessToken}` },
  });

  if (userOrgRequest.status != 200) {
    throw `Get user org request returned status code ${userOrgRequest.status} instead of the expected 200`;
  }

  const validOrg = verifyOrg(userOrgRequest.data, providedOrg);

  return {
    validOrg,
    id,
  };
};
