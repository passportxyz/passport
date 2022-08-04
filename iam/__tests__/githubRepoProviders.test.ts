// ---- Test subject
import { ForkedGithubRepoProvider, StarredGithubRepoProvider } from "../src/providers/githubRepoProviders";

// ----- Types
import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const validGithubUserResponse = {
  data: {
    userId: "18723656",
    userLogin: "my-login-handle",
    type: "User",
  },
  status: 200,
};

const validGithubUserRepoResponse = {
  data: {
    name: 'the-cool-repo',
    owner: {
      id: "18723656",
    },
    stargazers_url: `https://api.github.com/repos/${validGithubUserResponse.data.userLogin}/the-cool-repo/stargazers`,
    stargazers_count: 4,
    forks_count: 5
  }
}

// const validGithubUserReposResponse = {
//   hasOneFork: true,
//   hasOneStar: true,
// }

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
    switch (url) {
      case 'https://api.github.com/user':
        return validGithubUserResponse;
      case "https://api.github.com/user/" + validGithubUserResponse.data.userLogin + "/repos":
        return validGithubUserRepoResponse;
      default:
        return 'Nothing found'
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

    expect(forkedGithubRepoProviderPayload).toEqual({
      valid: true,
      record: {
        id: validGithubUserResponse.data.userId + "gte1Fork",
      },
    });
  });
  
});