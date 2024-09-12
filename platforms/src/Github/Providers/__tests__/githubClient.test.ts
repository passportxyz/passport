import exp from "constants";
import * as githubClient from "../../../utils/githubClient";
import axios from "axios";
import { access } from "fs";

const mockCode = "code123";
const mockContributionRange: githubClient.ContributionRange = {
  from: "2022-07-01T00:00:00Z",
  to: "2023-06-30T00:00:00Z",
  iteration: 0,
};

const viewerResult = {
  contributionsCollection: [{ collection: [] }],
  createdAt: "2022-07-01T00:00:00Z",
} as unknown as githubClient.Viewer;

const mockContributionData: githubClient.GithubUserData = {
  contributionData: {
    contributionCollection: [viewerResult.contributionsCollection],
    iteration: 0,
  },
  createdAt: "2022-07-01T00:00:00Z",
};

const mockGithubContext = {
  accessToken: "abc",
  clientId: "123",
  clientSecret: "secret",
  github: {
    contributionData: {
      contributionCollection: [],
      iteration: 0,
    },
    createdAt: "2022-07-01T00:00:00Z",
    accessToken: "abc",
  },
} as unknown as githubClient.GithubContext;

const mockContributionDay = (day: number): githubClient.ContributionDay => ({
  contributionCount: 1,
  date: `2020-01-${day}`,
});

const mockFetchGithubUserData = {
  contributionData: {
    contributionCollection: [
      {
        contributionCalendar: {
          weeks: [
            {
              contributionDays: [mockContributionDay(1), mockContributionDay(2), mockContributionDay(3)],
            },
          ],
        },
      },
    ],
  },
} as unknown as githubClient.GithubUserData;

const mockFetchGithubUserDataCall = jest.spyOn(githubClient, "fetchGithubUserData");

jest.mock("axios");

describe("githubClient", function () {
  describe("fetchAndCheckContributions", function () {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("validates contributions correctly", async () => {
      mockFetchGithubUserDataCall.mockImplementation(() => {
        return Promise.resolve(mockFetchGithubUserData);
      });
      const numDays = "1";
      const result = await githubClient.fetchAndCheckContributions(mockGithubContext, numDays, 3);
      expect(result).toEqual({
        contributionValid: true,
        numberOfDays: numDays,
      });
    });

    it("should not call fetchGithubUserData multiple times number of contribution days is valid", async () => {
      const contributionsValidData = {
        contributionData: {
          contributionCollection: [
            {
              contributionCalendar: {
                weeks: [
                  {
                    contributionDays: [mockContributionDay(1), mockContributionDay(2)], // Ensure that the contributions are valid
                  },
                ],
              },
            },
          ],
        },
      } as unknown as githubClient.GithubUserData;

      mockFetchGithubUserDataCall.mockImplementation(() => {
        return Promise.resolve(contributionsValidData);
      });

      await githubClient.fetchAndCheckContributions(mockGithubContext, "1", 3);

      expect(mockFetchGithubUserDataCall).toHaveBeenCalledTimes(1);
    });

    it("handles errors correctly", async () => {
      mockFetchGithubUserDataCall.mockImplementation(() => {
        return Promise.resolve({ errors: ["Some error"] });
      });

      const result = await githubClient.fetchAndCheckContributions(mockGithubContext, "1", 3);

      expect(result).toEqual({
        contributionValid: false,
        errors: ["Some error"],
      });
    });

    it("handles insufficient contributions correctly", async () => {
      mockFetchGithubUserDataCall.mockImplementation(() => {
        return Promise.resolve(mockFetchGithubUserData);
      });

      const numDays = "4";

      const result = await githubClient.fetchAndCheckContributions(mockGithubContext, numDays, 3);

      expect(result).toEqual({
        contributionValid: false,
        numberOfDays: numDays,
      });
    });
  });

  describe("fetchGithubUserData", function () {
    beforeEach(() => {
      mockFetchGithubUserDataCall.mockRestore();
    });

    it("should fetch a user's github data", async () => {
      jest.spyOn(githubClient, "queryFunc").mockImplementationOnce(() => {
        return Promise.resolve(viewerResult);
      });
      const result = await githubClient.fetchGithubUserData({ github: {} }, mockContributionRange);
      expect(result).toEqual(mockContributionData);
    });

    it("handles rate limit exceeded error correctly", async () => {
      jest.spyOn(githubClient, "queryFunc").mockImplementationOnce(() => {
        throw { response: { status: 429 } };
      });
      const result = await githubClient.fetchGithubUserData(mockGithubContext, mockContributionRange);
      expect(result).toEqual({
        errors: ["Error getting getting github info", "Rate limit exceeded"],
      });
    });

    it("handles other errors correctly", async () => {
      jest.spyOn(githubClient, "queryFunc").mockImplementationOnce(() => {
        throw { response: { status: 401 }, message: "Some error" };
      });
      const result = await githubClient.fetchGithubUserData(mockGithubContext, mockContributionRange);
      expect(result).toEqual({
        errors: ["Error getting getting github info", "Some error"],
      });
    });
  });

  describe("fetchAndCheckContributionsToRepozitory", function () {
    beforeEach(() => {
      mockFetchGithubUserDataCall.mockRestore();
      jest.clearAllMocks();
    });

    it("Should fetch a user github commits exactly once, if it contains commits on sufficient number of different days", async () => {
      jest.spyOn(axios, "get").mockImplementation((url: string): Promise<{}> => {
        return new Promise((resolve) => {
          resolve({
            data: [
              {
                commit: {
                  author: {
                    date: "2024-01-01T00:00:00Z",
                  },
                },
              },
              {
                commit: {
                  author: {
                    date: "2024-01-02T00:00:00Z",
                  },
                },
              },
              {
                commit: {
                  author: {
                    date: "2024-01-03T00:00:00Z",
                  },
                },
              },
            ],
          });
        });
      });

      await expect(
        githubClient.fetchAndCheckContributionsToRepozitory(mockGithubContext, 3, 5, "passportxyz/passport")
      ).resolves.toEqual({
        contributionValid: true,
        numberOfDays: 3,
      });
      expect(axios.get).toHaveBeenCalledTimes(1);

      const expectedCommitsUrl = `https://api.github.com/repos/passportxyz/passport/commits`;
      expect(axios.get).toHaveBeenCalledWith(expectedCommitsUrl, {
        headers: { Authorization: `token ${mockGithubContext.github.accessToken}` },
        params: { page: 1, per_page: 100 },
      });
    });

    it("Should fetch a user github commits multiple times until it is determined the user has commits on a sufficient number of distinct days", async () => {
      let day = 0;
      jest.spyOn(axios, "get").mockImplementation((url: string): Promise<{}> => {
        return new Promise((resolve) => {
          day += 1;
          resolve({
            data: [
              {
                commit: {
                  author: {
                    date: `2024-01-${day.toString().padStart(2, "0")}T00:00:00Z`,
                  },
                },
              },
              {
                commit: {
                  author: {
                    date: `2024-01-${day.toString().padStart(2, "0")}T01:00:00Z`,
                  },
                },
              },
              {
                commit: {
                  author: {
                    date: `2024-01-${day.toString().padStart(2, "0")}T01:00:00Z`,
                  },
                },
              },
            ],
          });
        });
      });

      await expect(
        githubClient.fetchAndCheckContributionsToRepozitory(mockGithubContext, 3, 5, "passportxyz/passport")
      ).resolves.toEqual({
        contributionValid: true,
        numberOfDays: 3,
      });
      expect(axios.get).toHaveBeenCalledTimes(3);

      const expectedCommitsUrl = `https://api.github.com/repos/passportxyz/passport/commits`;
      expect(axios.get).toHaveBeenCalledWith(expectedCommitsUrl, {
        headers: { Authorization: `token ${mockGithubContext.github.accessToken}` },
        params: { page: 1, per_page: 100 },
      });
      expect(axios.get).toHaveBeenCalledWith(expectedCommitsUrl, {
        headers: { Authorization: `token ${mockGithubContext.github.accessToken}` },
        params: { page: 2, per_page: 100 },
      });
      expect(axios.get).toHaveBeenCalledWith(expectedCommitsUrl, {
        headers: { Authorization: `token ${mockGithubContext.github.accessToken}` },
        params: { page: 3, per_page: 100 },
      });
    });

    it("Should report an error if fetching the github commits fails", async () => {
      const error = new Error("Request failed");
      jest.spyOn(axios, "get").mockImplementation((url: string): Promise<{}> => {
        return new Promise((_, reject) => {
          reject(error);
        });
      });

      await expect(
        githubClient.fetchAndCheckContributionsToRepozitory(mockGithubContext, 3, 5, "passportxyz/passport")
      ).rejects.toEqual(error);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });
});
