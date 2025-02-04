/* eslint-disable */
// ---- Test subject

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { GitcoinGrantStatisticsProvider } from "../gitcoinGrantsStatistics.js";
import { type ProviderOptions } from "../../../types.js";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const userHandle = "my-login-handle";
const cgrantsApiToken = process.env.SCORER_API_KEY;

const address = "0x0";

const validGithubUserResponse = {
  data: {
    address,
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
const testProviderPrefix = "GitcoinGrantStatisticsProviderTester";

const code = "ABC123_ACCESSCODE";

class GitcoinGrantStatisticsProviderTester extends GitcoinGrantStatisticsProvider {
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
    const gitcoin = new GitcoinGrantStatisticsProviderTester({
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
    ["total_contribution_amount", "totalContributionAmountGte", 12, 11, false],
    ["total_contribution_amount", "totalContributionAmountGte", 12, 12, true],
    ["total_contribution_amount", "totalContributionAmountGte", 12, 13, true],
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
        if (url.includes(testDataUrlPath))
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
          address,
          proofs: {
            code,
          },
        } as unknown as RequestPayload,
        {}
      );

      expect(axios.get).toHaveBeenCalledTimes(1);

      // Check the request to get the contribution stats
      expect(mockedAxios.get).toBeCalledWith(`${testUrl}?address=${address}`, {
        headers: { Authorization: cgrantsApiToken },
      });

      if (expectedValid)
        expect(gitcoinPayload).toEqual({
          valid: true,
          record: {
            address,
            [recordAttribute]: `${threshold}`,
          },
          errors: [],
        });
      else
        expect(gitcoinPayload).toEqual({
          valid: false,
          record: undefined,
          errors: [
            `You do not qualify for this stamp. Your Grantee stats are less than the required thresholds: ${returnedValue} out of ${threshold}.`,
          ],
        });
    }
  );
  it("should gracefully handle error responses from the scorer API", async () => {
    const error = "Error";
    (axios.get as jest.Mock).mockRejectedValue({
      message: error,
      response: {
        status: 500,
        statusText: "Internal Server Error",
        data: {},
      },
    });

    const gitcoin = new GitcoinGrantStatisticsProviderTester({
      threshold: 1000,
      receivingAttribute: "total_contribution_amount",
      recordAttribute: "totalContributionAmountGte",
    });

    await expect(
      async () =>
        await gitcoin.verify(
          {
            address,
            proofs: {
              code,
            },
          } as unknown as RequestPayload,
          {}
        )
    ).rejects.toThrow(
      "Gitcoin Grants Statistic verification error: ProviderExternalVerificationError: Error getting user info: Error - Status 500: Internal Server Error - Details: {}."
    );
  });
});
