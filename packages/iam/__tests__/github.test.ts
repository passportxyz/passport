// ---- Test subject
import { GithubProvider } from "../src/providers/github";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const validGithubUserResponse = {
  data: {
    id: "18723656",
    login: "my-login-handle",
    type: "User",
  },
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
    return validGithubUserResponse;
  });
});

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const github = new GithubProvider();
    const githubPayload = await github.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

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

    expect(githubPayload).toEqual({
      valid: true,
      record: {
        id: validGithubUserResponse.data.id,
      },
    });
  });

  it("should return invalid payload when unable to retrieve auth token", async () => {
    mockedAxios.post.mockImplementation(async (url, data, config) => {
      return {
        status: 500,
      };
    });

    const github = new GithubProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

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

    const github = new GithubProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(githubPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by github user api", async () => {
    mockedAxios.get.mockImplementation(async (url, config) => {
      return {
        status: 500,
      };
    });

    const github = new GithubProvider();

    const githubPayload = await github.verify({
      proofs: {
        code,
      },
    } as unknown as RequestPayload);

    expect(githubPayload).toMatchObject({ valid: false });
  });
});
