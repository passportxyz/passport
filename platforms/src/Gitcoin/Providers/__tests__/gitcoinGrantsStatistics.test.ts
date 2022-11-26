/* eslint-disable */
// ---- Test subject

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { GitcoinGrantStatisticsProvider } from "../gitcoinGrantsStatistics";
import type { ProviderOptions } from "../../../types";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const userHandle = "my-login-handle";
const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const gitcoinAmiApiToken = process.env.AMI_API_TOKEN;

const validGithubUserResponse = {
  data: {
    id: "18723656",
    login: userHandle,
    type: "User",
  },
  status: 200,
};

const githubAccessCode = "762165719dhiqudgasyuqwt6235";
const validCodeResponse = {
  data: {
    access_token: githubAccessCode,
  },
  status: 200,
};

const testDataUrl = "https://gitcoin.co/grants/v1/api/vc/configurable_test_endpoint";
const testProviderPrefix = "GitcoinGrantStatisticsProviderTester";

const code = "ABC123_ACCESSCODE";

class GitcoinGrantStatisticsProviderTester extends GitcoinGrantStatisticsProvider {
  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    super(testProviderPrefix, options);
    this.dataUrl = testDataUrl;
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedAxios.post.mockImplementation(async () => {
    return validCodeResponse;
  });
});

describe("GitcoinGrantStatisticsProvider class", function () {
  it("should properly initialize the attributes", function () {
    const threshold = 193;
    const receivingAttribute = "aaa";
    const recordAttribute = "bbb";
    const gitcoin = new GitcoinGrantStatisticsProviderTester({
      threshold,
      receivingAttribute,
      recordAttribute,
    });

    expect(gitcoin.type).toEqual(`${testProviderPrefix}#${recordAttribute}#${threshold}`);
    expect(gitcoin.dataUrl).toEqual(testDataUrl);
  });
});

describe("Attempt verification %s", function () {
  it.each([
    ["num_grants_contribute_to", "numGrantsContributedToGte", 123, 122, false],
    ["num_grants_contribute_to", "numGrantsContributedToGte", 123, 123, true],
    ["num_grants_contribute_to", "numGrantsContributedToGte", 123, 124, true],
    ["num_rounds_contribute_to", "numRoundsContributedToGte", 12, 11, false],
    ["num_rounds_contribute_to", "numRoundsContributedToGte", 12, 12, true],
    ["num_rounds_contribute_to", "numRoundsContributedToGte", 12, 13, true],
  ])(
    " for %p (and VerifiedPayload record %p) with threshold %p for the received value is %p expects %p",
    async (
      receivingAttribute: string,
      recordAttribute: string,
      threshold: number,
      returnedValue: number,
      expectedValid: boolean
    ) => {
      (axios.get as jest.Mock).mockImplementation((url) => {
        if (url === "https://api.github.com/user") return Promise.resolve(validGithubUserResponse);
        else if (url.startsWith(testDataUrl))
          return Promise.resolve({
            status: 200,
            data: {
              ...{
                num_grants_contribute_to: 0,
                num_rounds_contribute_to: 0,
                total_contribution_amount: 0,
                num_gr14_contributions: false,
              },
              [receivingAttribute]: returnedValue,
            },
          });
      });

      const gitcoin = new GitcoinGrantStatisticsProviderTester({
        threshold,
        receivingAttribute,
        recordAttribute,
      });
      const gitcoinPayload = await gitcoin.verify(
        {
          address: "0x0",
          proofs: {
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(axios.post).toHaveBeenCalledTimes(1);
      // Check the request to get the token
      expect(mockedAxios.post).toBeCalledWith(
        `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
        {},
        {
          headers: { Accept: "application/json" },
        }
      );

      expect(axios.get).toHaveBeenCalledTimes(2);
      // Check the request to get the user
      expect(mockedAxios.get).toBeCalledWith("https://api.github.com/user", {
        headers: { Authorization: `token ${githubAccessCode}` },
      });

      // Check the request to get the contribution stats
      expect(mockedAxios.get).toBeCalledWith(`${testDataUrl}?handle=${userHandle}`, {
        headers: { Authorization: `token ${gitcoinAmiApiToken}` },
      });

      if (expectedValid)
        expect(gitcoinPayload).toEqual({
          valid: true,
          record: {
            id: validGithubUserResponse.data.id,
            [recordAttribute]: `${threshold}`,
          },
        });
      else
        expect(gitcoinPayload).toEqual({
          valid: false,
        });
    }
  );

  it("should return invalid payload when unable to retrieve auth token (http status code 500 received)", async () => {
    (axios.post as jest.Mock).mockImplementation(async (url, data, config) => {
      return {
        status: 500,
      };
    });

    (axios.get as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        status: 200,
        data: {},
      });
    });

    const github = new GitcoinGrantStatisticsProviderTester({ threshold: 1 });

    const gitcoinPayload = await github.verify(
      {
        address: "0x0",
        proofs: {
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(0);
    expect(gitcoinPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when unable to retrieve auth token (exception thrown)", async () => {
    (axios.post as jest.Mock).mockImplementation(async (url, data, config) => {
      throw "Some kind of error";
    });

    (axios.get as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        status: 200,
        data: {},
      });
    });

    const github = new GitcoinGrantStatisticsProviderTester({ threshold: 1 });

    const gitcoinPayload = await github.verify(
      {
        address: "0x0",
        proofs: {
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(0);
    expect(gitcoinPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no id in verifyGithub response", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://api.github.com/user")
        return Promise.resolve({
          ...validGithubUserResponse,
          data: {
            // no id set here
            login: userHandle,
            type: "User",
          },
        });
      else if (url.startsWith("https://gitcoin.co/grants/v1/api/vc/contributor_statistics"))
        return Promise.resolve({
          status: 200,
          data: {
            ...{
              num_grants_contribute_to: 0,
              num_rounds_contribute_to: 0,
              total_contribution_amount: 0,
              num_gr14_contributions: false,
            },
          },
        });
    });

    const github = new GitcoinGrantStatisticsProviderTester({ threshold: 1 });

    const gitcoinPayload = await github.verify(
      {
        address: "0x0",
        proofs: {
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(axios.post).toHaveBeenCalledTimes(1);
    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.github.com/user", {
      headers: { Authorization: `token ${githubAccessCode}` },
    });
    expect(gitcoinPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad status code is returned by github user api", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://api.github.com/user") throw new Error("API EXCEPTION");
      else if (url.startsWith("https://gitcoin.co/grants/v1/api/vc/contributor_statistics"))
        return Promise.resolve({
          status: 200,
          data: {
            ...{
              num_grants_contribute_to: 0,
              num_rounds_contribute_to: 0,
              total_contribution_amount: 0,
              num_gr14_contributions: false,
            },
          },
        });
    });

    const github = new GitcoinGrantStatisticsProviderTester({ threshold: 1 });

    const gitcoinPayload = await github.verify(
      {
        address: "0x0",
        proofs: {
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(axios.post).toHaveBeenCalledTimes(1);
    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.github.com/user", {
      headers: { Authorization: `token ${githubAccessCode}` },
    });
    expect(gitcoinPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when a bad response received when calling the github user api (exception thrown)", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://api.github.com/user") throw "Some kind of error";
      else if (url.startsWith("https://gitcoin.co/grants/v1/api/vc/contributor_statistics"))
        return Promise.resolve({
          status: 200,
          data: {
            ...{
              num_grants_contribute_to: 0,
              num_rounds_contribute_to: 0,
              total_contribution_amount: 0,
              num_gr14_contributions: false,
            },
          },
        });
    });

    const github = new GitcoinGrantStatisticsProviderTester({ threshold: 1 });

    const gitcoinPayload = await github.verify(
      {
        address: "0x0",
        proofs: {
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(axios.post).toHaveBeenCalledTimes(1);
    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.github.com/user", {
      headers: { Authorization: `token ${githubAccessCode}` },
    });
    expect(gitcoinPayload).toMatchObject({ valid: false });
  });

  it("should use the lowercase github handle when making querying the gitcoin API", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url === "https://api.github.com/user") {
        return Promise.resolve({
          data: {
            id: "18723656",
            login: "User-Handle-With-Upper",
            type: "User",
          },
          status: 200,
        });
      } else if (url.startsWith("https://gitcoin.co/grants/v1/api/vc/contributor_statistics"))
        return Promise.resolve({
          status: 200,
          data: {
            ...{
              num_grants_contribute_to: 0,
              num_rounds_contribute_to: 0,
              total_contribution_amount: 0,
              num_gr14_contributions: false,
            },
          },
        });
    });

    const github = new GitcoinGrantStatisticsProviderTester({ threshold: 1 });

    const gitcoinPayload = await github.verify(
      {
        address: "0x0",
        proofs: {
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(axios.post).toHaveBeenCalledTimes(1);
    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(
      `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      {},
      {
        headers: { Accept: "application/json" },
      }
    );

    expect(axios.get).toHaveBeenCalledTimes(2);

    // Check the request to get the user
    expect(mockedAxios.get).toBeCalledWith("https://api.github.com/user", {
      headers: { Authorization: `token ${githubAccessCode}` },
    });
    expect(mockedAxios.get).nthCalledWith(2, `${testDataUrl}?handle=user-handle-with-upper`, {
      headers: { Authorization: `token ${gitcoinAmiApiToken}` },
    });
    expect(gitcoinPayload).toMatchObject({ valid: false });
  });
});
