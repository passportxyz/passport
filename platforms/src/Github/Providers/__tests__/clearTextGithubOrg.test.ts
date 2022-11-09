// TODO - Remove once ts lint has been unified across packages
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */
// ---- Test subject
import { ClearTextGithubOrgProvider, ClientType, GHUserRequestPayload } from "../clearTextGithubOrg";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const requestedClient = ClientType.GrantHub;

const handle = "my-login-handle";

const validGithubUserResponse = {
  data: {
    id: "18723656",
    login: handle,
    type: "User",
  },
  status: 200,
};

const validGithubOrgResponse = {
  data: [
    {
      login: "gitcoinco",
    },
  ],
  status: 200,
};

const unexpectedGithubOrgResponse = {
  data: [
    {
      login: "uniswap",
    },
  ],
  status: 200,
};

const validCodeResponse = {
  data: {
    access_token: "762165719dhiqudgasyuqwt6235",
  },
  status: 200,
};

const code = "ABC123_ACCESSCODE";

const org = "gitcoinco";

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async (url, data, config) => {
    return validCodeResponse;
  });

  mockedAxios.get.mockImplementation(async (url, config) => {
    switch (url) {
      case "https://api.github.com/user":
        return validGithubUserResponse;
      case "https://api.github.com/users/my-login-handle/orgs":
        return validGithubOrgResponse;
      default:
        return {
          status: 404,
        };
    }
  });
});

describe("Attempt verification", function () {
  const pii = `${org}#${validGithubUserResponse.data.id}`;
  it("handles valid verification attempt", async () => {
    const clientId = process.env.GRANT_HUB_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GRANT_HUB_GITHUB_CLIENT_SECRET;
    const github = new ClearTextGithubOrgProvider();
    const githubPayload = await github.verify({
      proofs: {
        code,
      },
      org,
      requestedClient,
    } as unknown as GHUserRequestPayload);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.github.com/user", {
      headers: { Authorization: "token 762165719dhiqudgasyuqwt6235" },
    });

    // Check the request to get the user's org
    expect(mockedAxios.get).toBeCalledWith("https://api.github.com/users/my-login-handle/orgs", {
      headers: { Authorization: "token 762165719dhiqudgasyuqwt6235" },
    });

    expect(githubPayload).toEqual({
      valid: true,
      record: {
        pii,
      },
    });
  });

  it("handles valid access token request when no requestedClient is provided", async () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    const github = new ClearTextGithubOrgProvider();
    await github.verify({
      proofs: {
        code,
      },
      org,
      requestedClient: undefined,
    } as unknown as GHUserRequestPayload);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );
  });

  it("should return invalid payload when unable to retrieve auth token", async () => {
    mockedAxios.post.mockImplementation(async (url, data, config) => {
      return {
        status: 500,
      };
    });

    const github = new ClearTextGithubOrgProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
      org,
      requestedClient,
    } as unknown as GHUserRequestPayload);

    expect(githubPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no id in verifyGithub response", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        data: {
          id: undefined,
          login: "my-login-handle",
          type: "User",
        },
        status: 200,
      };
    });

    const github = new ClearTextGithubOrgProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
      org,
      requestedClient,
    } as unknown as GHUserRequestPayload);

    expect(githubPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by github user api", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        status: 500,
      };
    });

    const github = new ClearTextGithubOrgProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
      org,
      requestedClient,
    } as unknown as GHUserRequestPayload);

    expect(githubPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by github org api", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      if (url === "https://api.github.com/users/my-login-handle/orgs") {
        return {
          status: 500,
        };
      }
    });

    const github = new ClearTextGithubOrgProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
      org,
      requestedClient,
    } as unknown as GHUserRequestPayload);

    expect(githubPayload).toMatchObject({ valid: false });
  });

  it("should return invalid if provided org is not returned from github", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      if (url === "https://api.github.com/users/my-login-handle/orgs") {
        return unexpectedGithubOrgResponse;
      }
    });

    const github = new ClearTextGithubOrgProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
      org,
      requestedClient,
    } as unknown as GHUserRequestPayload);

    expect(githubPayload).toMatchObject({ valid: false });
  });
});
