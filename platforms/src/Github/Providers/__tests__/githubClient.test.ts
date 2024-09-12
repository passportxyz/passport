import axios from "axios";
import {
  fetchAndCheckContributions,
  GithubContext,
  GithubContributionResponse,
  MAX_YEARS_TO_CHECK,
} from "../../../utils/githubClient";

jest.mock("axios");
const mockedPost = jest.spyOn(axios, "post");

describe("fetchAndCheckContributions", () => {
  const mockCode = "test-code";
  const mockAccessToken = "test-access-token";
  const mockUserId = "test-user-id";

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should fetch and check contributions successfully, counting commits from the same day together", async () => {
    // Mock the access token request
    mockedPost.mockResolvedValueOnce({
      data: { access_token: mockAccessToken },
    });

    // Mock the GitHub API requests
    const mockApiResponse: GithubContributionResponse = {
      data: {
        data: {
          viewer: {
            id: mockUserId,
            createdAt: "2024-01-01T00:00:00Z",
            contributionsCollection: {
              commitContributionsByRepository: [
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-05T12:00:00Z",
                        repository: {
                          createdAt: "2024-01-01T00:00:00Z",
                        },
                      },
                    ],
                  },
                },
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [
                      {
                        commitCount: 2,
                        occurredAt: "2024-09-05T13:00:00Z",
                        repository: {
                          createdAt: "2024-09-04T14:13:54Z",
                        },
                      },
                      {
                        commitCount: 6,
                        occurredAt: "2024-09-08T13:00:00Z",
                        repository: {
                          createdAt: "2024-09-04T14:13:54Z",
                        },
                      },
                    ],
                  },
                },
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [
                      {
                        commitCount: 2,
                        occurredAt: "2024-09-06T13:00:00Z",
                        repository: {
                          createdAt: "2024-09-04T14:13:54Z",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    };

    mockedPost.mockResolvedValue(mockApiResponse);

    const context: GithubContext = {};
    const result = await fetchAndCheckContributions(context, mockCode);

    const expectedResult = {
      userId: mockUserId,
      contributionDays: 3,
      hadBadCommits: false,
    };

    expect(result).toEqual(expectedResult);

    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK + 1);

    // Make sure it uses cache on second call

    const anotherCallResult = await fetchAndCheckContributions(context, mockCode);

    expect(anotherCallResult).toEqual(expectedResult);

    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK + 1);
  });

  it("should use existing access token if available", async () => {
    const context: GithubContext = {
      github: {
        accessToken: mockAccessToken,
      },
    };

    // Mock the GitHub API requests
    const mockApiResponse: GithubContributionResponse = {
      data: {
        data: {
          viewer: {
            id: mockUserId,
            createdAt: "2024-01-01T00:00:00Z",
            contributionsCollection: {
              commitContributionsByRepository: [
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [
                      {
                        commitCount: 2,
                        occurredAt: "2024-09-05T00:00:00Z",
                        repository: {
                          createdAt: "2024-01-01T00:00:00Z",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    };

    mockedPost.mockResolvedValue(mockApiResponse);

    const result = await fetchAndCheckContributions(context, mockCode);

    expect(result).toEqual({
      userId: mockUserId,
      contributionDays: 1,
      hadBadCommits: false,
    });

    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK);
    expect(mockedPost).not.toHaveBeenCalledWith(expect.stringContaining("login/oauth/access_token"));
  });

  it("should handle bad commits", async () => {
    mockedPost.mockResolvedValueOnce({
      data: { access_token: mockAccessToken },
    });

    const mockApiResponse: GithubContributionResponse = {
      data: {
        data: {
          viewer: {
            id: mockUserId,
            createdAt: "2024-01-01T00:00:00Z",
            contributionsCollection: {
              commitContributionsByRepository: [
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [
                      {
                        commitCount: 1,
                        occurredAt: "2023-12-31T00:00:00Z", // Bad commit: before user creation
                        repository: {
                          createdAt: "2023-01-01T00:00:00Z",
                        },
                      },
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-08T00:00:00Z", // Bad commit: before repo creation
                        repository: {
                          createdAt: "2024-10-01T00:00:00Z",
                        },
                      },
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-05T00:00:00Z", // Good commit
                        repository: {
                          createdAt: "2024-01-01T00:00:00Z",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    };

    mockedPost.mockResolvedValue(mockApiResponse);

    const context: GithubContext = {};
    const result = await fetchAndCheckContributions(context, mockCode);

    expect(result).toEqual({
      userId: mockUserId,
      contributionDays: 1,
      hadBadCommits: true,
    });
  });

  it("should paginate", async () => {
    // Mock the access token request
    mockedPost.mockResolvedValueOnce({
      data: { access_token: mockAccessToken },
    });

    // Mock the GitHub API requests
    const firstPageMockResponse: GithubContributionResponse = {
      data: {
        data: {
          viewer: {
            id: mockUserId,
            createdAt: "2024-01-01T00:00:00Z",
            contributionsCollection: {
              commitContributionsByRepository: [
                {
                  contributions: {
                    pageInfo: {
                      endCursor: "MQ",
                      hasNextPage: true,
                    },
                    nodes: [
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-06T07:00:00Z",
                        repository: {
                          createdAt: "2022-03-14T17:57:02Z",
                        },
                      },
                    ],
                  },
                },
                {
                  contributions: {
                    pageInfo: {
                      endCursor: "MQ",
                      hasNextPage: true,
                    },
                    nodes: [
                      {
                        commitCount: 3,
                        occurredAt: "2024-09-05T07:00:00Z",
                        repository: {
                          createdAt: "2022-11-18T18:16:06Z",
                        },
                      },
                    ],
                  },
                },
                {
                  contributions: {
                    pageInfo: {
                      endCursor: "MQ",
                      hasNextPage: false,
                    },
                    nodes: [
                      {
                        commitCount: 2,
                        occurredAt: "2024-09-04T07:00:00Z",
                        repository: {
                          createdAt: "2024-06-28T09:02:44Z",
                        },
                      },
                    ],
                  },
                },
                {
                  contributions: {
                    pageInfo: {
                      endCursor: "MQ",
                      hasNextPage: false,
                    },
                    nodes: [
                      {
                        commitCount: 2,
                        occurredAt: "2024-09-04T07:00:00Z",
                        repository: {
                          createdAt: "2024-03-07T08:47:47Z",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    };

    const secondPageMockResponse: GithubContributionResponse = {
      data: {
        data: {
          viewer: {
            id: mockUserId,
            createdAt: "2024-01-01T00:00:00Z",
            contributionsCollection: {
              commitContributionsByRepository: [
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [
                      {
                        commitCount: 2,
                        occurredAt: "2024-09-04T07:00:00Z",
                        repository: {
                          createdAt: "2022-03-14T17:57:02Z",
                        },
                      },
                      {
                        commitCount: 2,
                        occurredAt: "2024-09-10:00:00Z",
                        repository: {
                          createdAt: "2022-03-14T17:57:02Z",
                        },
                      },
                    ],
                  },
                },
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [],
                  },
                },
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [],
                  },
                },
                {
                  contributions: {
                    pageInfo: {
                      endCursor: null,
                      hasNextPage: false,
                    },
                    nodes: [],
                  },
                },
              ],
            },
          },
        },
      },
    };

    for (let i = 0; i < MAX_YEARS_TO_CHECK; i++) {
      mockedPost.mockResolvedValueOnce(firstPageMockResponse);
      mockedPost.mockResolvedValueOnce(secondPageMockResponse);
    }

    const context: GithubContext = {};
    const result = await fetchAndCheckContributions(context, mockCode);

    const expectedResult = {
      userId: mockUserId,
      contributionDays: 4,
      hadBadCommits: false,
    };

    expect(result).toEqual(expectedResult);

    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK * 2 + 1);
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
