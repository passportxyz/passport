import * as githubClient from "../../../utils/githubClient";

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
});
