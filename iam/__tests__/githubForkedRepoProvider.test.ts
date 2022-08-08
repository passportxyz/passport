// ---- Test subject
import { ForkedGithubRepoProvider } from "../src/providers/githubForkedRepoProvider";

// ----- Types
import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const validGithubUserResponse = {
  data: {
    id: "18723656",
    login: "a-cool-user",
    type: "User",
  },
  status: 200,
};

const validGithubUserRepoResponse = {
  data: [
    {
      owner: {
        id: "18723656",
        type: "User",
      },
      fork: false,
      forks_count: 5,
    },
    {
      owner: {
        id: "18723656",
        type: "User",
      },
      fork: true,
      forks_count: 2,
    }
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

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async (url, data, config) => {
    return validCodeResponse;
  });
  
  mockedAxios.get.mockImplementation(async (url, config) => {
    if (url.endsWith('/user')) {
      return validGithubUserResponse;
    }
    if (url.endsWith('/repos')) {
      return validGithubUserRepoResponse;
    }
  });
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const forkedGithubRepoProvider = new ForkedGithubRepoProvider();
    const forkedGithubRepoProviderPayload = await forkedGithubRepoProvider.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);
    // Check the request to get the token for the user
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

    // Check the request to get the repo
    expect(mockedAxios.get).toBeCalledWith(`https://api.github.com/users/${validGithubUserResponse.data.login}/repos`, {
      headers: { Authorization: "token 762165719dhiqudgasyuqwt6235" },
    });

    expect(forkedGithubRepoProviderPayload).toEqual({
      valid: true,
      record: {
        id: `${validGithubUserResponse.data.id}gte1Fork`,
      },
    });
  });

  it("should return invalid payload when unable to retrieve auth token", async () => {
    mockedAxios.post.mockImplementation(async (url, data, config) => {
      return {
        status: 500,
      };
    });

    const forkedGithubRepoProvider = new ForkedGithubRepoProvider();

    const forkedGithubRepoProviderPayload = await forkedGithubRepoProvider.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(forkedGithubRepoProviderPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no id in verifyGithub response", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        data: {
          id: undefined,
          login: "a-cool-user",
          type: "User",
        },
        status: 200,
      };
    });

    const forkedGithubRepoProvider = new ForkedGithubRepoProvider();

    const forkedGithubRepoProviderPayload = await forkedGithubRepoProvider.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(forkedGithubRepoProviderPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when the fork count for all repos is less than 1", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        data: [
          {
            owner: {
              id: "18723656",
              type: "User",
            },
            fork: false,
            forks_count: 0,
          },
          {
            owner: {
              id: "18723656",
              type: "User",
            },
            fork: true,
            forks_count: 0,
          }
        ],
        status: 200,
      };
    });

    const forkedGithubRepoProvider = new ForkedGithubRepoProvider();

    const forkedGithubRepoProviderPayload = await forkedGithubRepoProvider.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(forkedGithubRepoProviderPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by github user request", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      if (url.endsWith('/user')) {
        return {
          status: 500,
        };
      }
    });

    const forkedGithubRepoProvider = new ForkedGithubRepoProvider();

    const forkedGithubRepoProviderPayload = await forkedGithubRepoProvider.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(forkedGithubRepoProviderPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by github repo request", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      if (url.endsWith('/repos')) {
        return {
          status: 500,
        };
      }
    });

    const forkedGithubRepoProvider = new ForkedGithubRepoProvider();

    const forkedGithubRepoProviderPayload = await forkedGithubRepoProvider.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(forkedGithubRepoProviderPayload).toMatchObject({ valid: false });
  });
});
