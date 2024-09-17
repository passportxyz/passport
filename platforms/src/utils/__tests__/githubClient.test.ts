import axios from "axios";
import {
  fetchAndCheckContributions,
  fetchAndCheckContributionsToRepository,
  GithubContext,
  GithubContributionResponse,
  MAX_YEARS_TO_CHECK,
  RepoCommit,
} from "../githubClient";

jest.mock("axios");
const mockedPost = jest.spyOn(axios, "post");
const mockedGet = jest.spyOn(axios, "get");
const mockGithubCOntext: GithubContext = {
  github: {
    accessToken: "github-access-token",
    login: "github-login",
  },
};

describe("fetchAndCheckContributions", () => {
  const mockCode = "test-code";
  const mockAccessToken = "test-access-token";
  const mockUserId = "test-user-id";

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should fetch and check contributions successfully, counting commits from the same day together", async () => {
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

    const result = await fetchAndCheckContributions(mockGithubCOntext, mockCode);

    const expectedResult = {
      userId: mockUserId,
      contributionDays: 3,
      hadBadCommits: false,
    };

    expect(result).toEqual(expectedResult);

    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK);

    // Make sure it uses cache on second call

    const anotherCallResult = await fetchAndCheckContributions(mockGithubCOntext, mockCode);

    expect(anotherCallResult).toEqual(expectedResult);

    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK);
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

    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK * 2);
  });
});

describe("fetchAndCheckContributionsToRepository", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should validate a proper user", async () => {
    // Mock the GitHub API requests
    const mockApiResponse: { data: RepoCommit[] } = {
      data: [
        {
          commit: {
            author: {
              date: "2024-09-05T12:00:00Z",
            },
          },
        },
        {
          commit: {
            author: {
              date: "2024-09-06T12:00:00Z",
            },
          },
        },
        {
          commit: {
            author: {
              date: "2024-09-07T12:00:00Z",
            },
          },
        },
        {
          commit: {
            author: {
              date: "2024-09-08T12:00:00Z",
            },
          },
        },
        {
          commit: {
            author: {
              date: "2024-09-09T12:00:00Z",
            },
          },
        },
      ],
    };

    let numRequests = 0;
    mockedGet.mockImplementation(() => {
      numRequests += 1;
      if (numRequests > 2) {
        return Promise.resolve({ data: [] });
      } else {
        return Promise.resolve(mockApiResponse);
      }
    });

    const result = await fetchAndCheckContributionsToRepository(mockGithubCOntext, 5, 10, "https://repo/name");

    const expectedResult = {
      contributionValid: true,
      numberOfDays: 5,
    };

    expect(result).toEqual(expectedResult);
    expect(mockedGet).toHaveBeenCalledTimes(1); // We expect the axiosget to have been called 3 times (2 times it would get data, the 3rd time an empty list would be returned)
  });

  it("should fail if a user does not have sufficient contributions", async () => {
    // Mock the GitHub API requests
    const mockApiResponse: { data: RepoCommit[] } = {
      data: [
        {
          commit: {
            author: {
              date: "2024-09-05T12:00:00Z",
            },
          },
        },
        {
          commit: {
            author: {
              date: "2024-09-06T12:00:00Z",
            },
          },
        },
        {
          commit: {
            author: {
              date: "2024-09-07T12:00:00Z",
            },
          },
        },
        {
          commit: {
            author: {
              date: "2024-09-08T12:00:00Z",
            },
          },
        },
        {
          commit: {
            author: {
              date: "2024-09-09T12:00:00Z",
            },
          },
        },
      ],
    };

    mockedGet.mockImplementation(() => {
      return Promise.resolve(mockApiResponse);
    });

    const result = await fetchAndCheckContributionsToRepository(mockGithubCOntext, 6, 1, "https://repo/name");

    const expectedResult = {
      contributionValid: false,
      numberOfDays: 5,
    };

    expect(result).toEqual(expectedResult);
    expect(mockedGet).toHaveBeenCalledTimes(1); // We expect the axiosget to have been called 3 times (2 times it would get data, the 3rd time an empty list would be returned)
  });

  it("should not make more requests than are allowed", async () => {
    // Mock the GitHub API requests
    const mockApiResponse: { data: RepoCommit[] } = {
      data: [
        {
          commit: {
            author: {
              date: "2024-09-05T12:00:00Z",
            },
          },
        },
      ],
    };

    mockedGet.mockImplementation(() => {
      return Promise.resolve(mockApiResponse);
    });

    const result = await fetchAndCheckContributionsToRepository(mockGithubCOntext, 6, 2, "https://repo/name");

    expect(mockedGet).toHaveBeenCalledTimes(2); // We expect the axiosget to have been called 3 times (2 times it would get data, the 3rd time an empty list would be returned)
  });

  it("should not make any more requests after an empty list has been received", async () => {
    // Mock the GitHub API requests
    const mockApiResponse: { data: RepoCommit[] } = {
      data: [
        {
          commit: {
            author: {
              date: "2024-09-05T12:00:00Z",
            },
          },
        },
      ],
    };

    let numRequests = 0;
    mockedGet.mockImplementation(() => {
      numRequests += 1;
      if (numRequests > 2) {
        return Promise.resolve({ data: [] });
      } else {
        return Promise.resolve(mockApiResponse);
      }
    });

    const result = await fetchAndCheckContributionsToRepository(mockGithubCOntext, 10, 10, "https://repo/name");

    const expectedResult = {
      contributionValid: false,
      numberOfDays: 1,
    };

    expect(result).toEqual(expectedResult);
    expect(mockedGet).toHaveBeenCalledTimes(3); // We expect the axiosget to have been called 3 times (2 times it would get data, the 3rd time an empty list would be returned)
  });

  it("should filter the commits in the github API by the author", async () => {
    // Mock the GitHub API requests
    const mockApiResponse: { data: RepoCommit[] } = {
      data: [
        {
          commit: {
            author: {
              date: "2024-09-05T12:00:00Z",
            },
          },
        },
      ],
    };

    let numRequests = 0;
    mockedGet.mockImplementation(() => {
      numRequests += 1;
      if (numRequests > 2) {
        return Promise.resolve({ data: [] });
      } else {
        return Promise.resolve(mockApiResponse);
      }
    });

    await fetchAndCheckContributionsToRepository(mockGithubCOntext, 10, 1, "https://repo/name");

    expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/repos/repo/name/commits", {
      headers: {
        Authorization: `token ${mockGithubCOntext.github.accessToken}`,
      },
      params: { page: 1, per_page: 100, author: mockGithubCOntext.github.login },
    });
  });
});
