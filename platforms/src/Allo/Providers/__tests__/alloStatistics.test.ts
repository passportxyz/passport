/* eslint-disable */
// ---- Test subject

import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderError } from "../../../utils/errors";

// ----- Libs
import axios from "axios";
import { AlloStatisticsProvider } from "../alloStatistics";
import type { ProviderOptions } from "../../../types";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const userHandle = "my-login-handle";
const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const cgrantsApiToken = process.env.CGRANTS_API_TOKEN;

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

const testDataUrlPath = "/testing";
const testUrl = process.env.CGRANTS_API_URL + testDataUrlPath;
const testProviderPrefix = "AlloStatisticsProviderTester ";

const code = "ABC123_ACCESSCODE";

class AlloStatisticsProviderTester extends AlloStatisticsProvider {
  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    super(testProviderPrefix, options);
    this.urlPath = testDataUrlPath;
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
    const gitcoin = new AlloStatisticsProviderTester({
      threshold,
      receivingAttribute,
      recordAttribute,
    });

    expect(gitcoin.type).toEqual(`${testProviderPrefix}#${recordAttribute}#${threshold}`);
    expect(gitcoin.urlPath).toEqual(testDataUrlPath);
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
        return Promise.resolve({
          status: 200,
          data: {
            ...{
              num_grants_contribute_to: 0,
              num_rounds_contribute_to: 0,
            },
            [receivingAttribute]: returnedValue,
          },
        });
      });

      const gitcoin = new AlloStatisticsProviderTester({
        threshold,
        receivingAttribute,
        recordAttribute,
      });
      const gitcoinPayload = await gitcoin.verify(
        {
          address: "0x1234ABCD",
          proofs: {
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(axios.get).toHaveBeenCalledTimes(1);

      // Check the request to get the contribution stats
      expect(mockedAxios.get).toBeCalledWith(testUrl, {
        headers: { Authorization: cgrantsApiToken },
        params: {
          address: "0x1234abcd",
        },
      });

      if (expectedValid)
        expect(gitcoinPayload).toEqual({
          valid: true,
          record: {
            address: "0x1234abcd",
            [recordAttribute]: `${threshold}`,
          },
        });
      else
        expect(gitcoinPayload).toEqual({
          valid: false,
        });
    }
  );

  it("should return invalid payload when getting 500 error from API call (exception thrown)", async () => {
    (axios.get as jest.Mock).mockImplementation(async (url, data, config) => {
      throw {
        message: "something went wrong",
        response: { status: 500, statusText: "Internal Server Error", data: "Internal Server Error" },
      };
    });

    const github = new AlloStatisticsProviderTester({ threshold: 1 });

    const gitcoinPayload = await github.verify(
      {
        address: "0x0",
        proofs: {
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(gitcoinPayload).toMatchObject({
      valid: false,
      error: [
        "Error getting info for address '0x0' on url 'undefined/testing'",
        "something went wrong",
        "Status 500: Internal Server Error",
        'Details: "Internal Server Error"',
      ],
    });
  });

  it("should use the lowercase address handle when querying the allo contributor API", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        status: 200,
        data: {
          ...{
            num_grants_contribute_to: 0,
            num_rounds_contribute_to: 0,
          },
        },
      });
    });

    const github = new AlloStatisticsProviderTester({ threshold: 1 });

    const gitcoinPayload = await github.verify(
      {
        address: "0x1234ABCD",
        proofs: {
          code,
        },
      } as unknown as RequestPayload,
      {}
    );

    expect(axios.get).toHaveBeenCalledTimes(1);

    // Check the request to get the user
    expect(mockedAxios.get).nthCalledWith(1, testUrl, {
      headers: { Authorization: cgrantsApiToken },
      params: {
        address: "0x1234abcd",
      },
    });
    expect(gitcoinPayload).toMatchObject({ valid: false });
  });
});
