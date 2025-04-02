import axios from "axios";
import {
  fetchAndCheckCommitCountToRepository,
  fetchAndCheckContributions,
  fetchAndCheckContributionsToOrganisation,
  fetchAndCheckContributionsToRepository,
  GithubContext,
  GithubContributionResponse,
  GithubOrgMetaData,
  MAX_YEARS_TO_CHECK,
  RepoCommit,
} from "../githubClient.js";

jest.mock("axios");
const mockedPost = jest.spyOn(axios, "post");
const mockedGet = jest.spyOn(axios, "get");
const baseMockGithubContext: GithubContext = {
  github: {
    accessToken: "github-access-token",
    login: "github-login",
  },
};

let mockGithubContext: GithubContext = JSON.parse(JSON.stringify(baseMockGithubContext));

describe("fetchAndCheckContributions", () => {
  const mockCode = "test-code";
  const mockAccessToken = "test-access-token";
  const mockUserId = "test-user-id";

  beforeEach(() => {
    jest.resetAllMocks();
    mockGithubContext = JSON.parse(JSON.stringify(baseMockGithubContext));
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
                          isPrivate: false,
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
                          isPrivate: false,
                        },
                      },
                      {
                        commitCount: 6,
                        occurredAt: "2024-09-08T13:00:00Z",
                        repository: {
                          createdAt: "2024-09-04T14:13:54Z",
                          isPrivate: false,
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
                          isPrivate: false,
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

    const result = await fetchAndCheckContributions(mockGithubContext, mockCode);

    const expectedResult = {
      userId: mockUserId,
      contributionDays: 3,
      hadBadCommits: false,
    };

    expect(result).toEqual(expectedResult);

    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK);

    // Make sure it uses cache on second call

    const anotherCallResult = await fetchAndCheckContributions(mockGithubContext, mockCode);

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
                          isPrivate: false,
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
                          isPrivate: false,
                        },
                      },
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-08T00:00:00Z", // Bad commit: before repo creation
                        repository: {
                          createdAt: "2024-10-01T00:00:00Z",
                          isPrivate: false,
                        },
                      },
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-05T00:00:00Z", // Good commit
                        repository: {
                          createdAt: "2024-01-01T00:00:00Z",
                          isPrivate: false,
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
                          isPrivate: false,
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
                          isPrivate: false,
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
                          isPrivate: false,
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
                          isPrivate: false,
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
                          isPrivate: false,
                        },
                      },
                      {
                        commitCount: 2,
                        occurredAt: "2024-09-10:00:00Z",
                        repository: {
                          createdAt: "2022-03-14T17:57:02Z",
                          isPrivate: false,
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

  it("should skip contributions from private repositories", async () => {
    // Mock the GitHub API requests
    const mockApiResponse: GithubContributionResponse = {
      data: {
        data: {
          viewer: {
            id: mockUserId,
            createdAt: "2024-01-01T00:01:23Z",
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
                          isPrivate: true, // Private repo
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
                          isPrivate: false, // Public repo
                        },
                      },
                      {
                        commitCount: 6,
                        occurredAt: "2024-09-08T13:00:00Z",
                        repository: {
                          createdAt: "2024-09-04T14:13:54Z",
                          isPrivate: true, // Private repo
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
                          isPrivate: false, // Public repo
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

    mockedPost.mockImplementation(() => Promise.resolve(mockApiResponse));

    const result = await fetchAndCheckContributions(mockGithubContext, mockCode);

    // Should only count the 2 public repository contributions
    const expectedResult = {
      userId: mockUserId,
      contributionDays: 2,
      hadBadCommits: false,
    };

    expect(result).toEqual(expectedResult);
    expect(mockedPost).toHaveBeenCalledTimes(MAX_YEARS_TO_CHECK);
  });

  it("should handle a mix of private/public repos and bad commits", async () => {
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
                          isPrivate: false,
                        },
                      },
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-08T00:00:00Z", // Bad commit: before repo creation
                        repository: {
                          createdAt: "2024-10-01T00:00:00Z",
                          isPrivate: false,
                        },
                      },
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-05T00:00:00Z", // Good commit but private
                        repository: {
                          createdAt: "2024-01-01T00:00:00Z",
                          isPrivate: true,
                        },
                      },
                      {
                        commitCount: 1,
                        occurredAt: "2024-09-10T00:00:00Z", // Good commit and public
                        repository: {
                          createdAt: "2024-01-01T00:00:00Z",
                          isPrivate: false,
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
      contributionDays: 1, // Only one valid public contribution
      hadBadCommits: true,
    });
  });
});

describe("fetchAndCheckContributionsToOrganisation", () => {
  const mockCode = "test-code";
  const mockAccessToken = "test-access-token";
  const mockUserId = "test-user-id";

  beforeEach(() => {
    jest.resetAllMocks();
    mockGithubContext = JSON.parse(JSON.stringify(baseMockGithubContext));

    const mockeGetOrgDataResponse: { data: GithubOrgMetaData } = {
      data: {
        node_id: "test-org-id",
      },
    };
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
                          isPrivate: false,
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
                          isPrivate: false,
                        },
                      },
                      {
                        commitCount: 6,
                        occurredAt: "2024-09-08T13:00:00Z",
                        repository: {
                          createdAt: "2024-09-04T14:13:54Z",
                          isPrivate: false,
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
                          isPrivate: false,
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

    mockedGet.mockResolvedValue(mockeGetOrgDataResponse);
    mockedPost.mockResolvedValue(mockApiResponse);
  });

  it("should fetch and check contributions successfully, counting commits from the same day together", async () => {
    const result = await fetchAndCheckContributionsToOrganisation(
      mockGithubContext,
      3,
      3,
      "https://github.org/test-org"
    );

    const expectedResult = {
      userId: mockUserId,
      contributionDays: 3,
      hadBadCommits: false,
    };

    expect(result).toEqual(expectedResult);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledTimes(1);

    // Make sure it uses cache on second call
    const anotherCallResult = await fetchAndCheckContributionsToOrganisation(
      mockGithubContext,
      3,
      3,
      "https://github.org/test-org"
    );

    expect(anotherCallResult).toEqual(expectedResult);

    expect(mockedGet).toHaveBeenCalledTimes(2);
    expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/orgs/test-org", {
      headers: {
        Authorization: `token ${mockGithubContext.github.accessToken}`,
      },
    });
    expect(mockedPost).toHaveBeenCalledTimes(2);
  });

  it("should fetch and check contributions successfully, counting commits from the same day together when the org url ends with '/'", async () => {
    const result = await fetchAndCheckContributionsToOrganisation(
      mockGithubContext,
      3,
      3,
      "https://github.org/test-org"
    );

    const expectedResult = {
      userId: mockUserId,
      contributionDays: 3,
      hadBadCommits: false,
    };

    expect(result).toEqual(expectedResult);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledTimes(1);

    // Make sure it uses cache on second call
    const anotherCallResult = await fetchAndCheckContributionsToOrganisation(
      mockGithubContext,
      3,
      3,
      "https://github.org/test-org"
    );

    expect(anotherCallResult).toEqual(expectedResult);

    expect(mockedGet).toHaveBeenCalledTimes(2);
    expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/orgs/test-org", {
      headers: {
        Authorization: `token ${mockGithubContext.github.accessToken}`,
      },
    });
    expect(mockedPost).toHaveBeenCalledTimes(2);
  });

  it("should skip contributions from private repositories in an organization", async () => {
    // Mock the GitHub API requests with a mix of private and public repos
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
                          isPrivate: true, // Private repo
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
                          isPrivate: false, // Public repo
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

    const result = await fetchAndCheckContributionsToOrganisation(
      mockGithubContext,
      3,
      3,
      "https://github.org/test-org"
    );

    // Should only count the 1 public repository contribution
    const expectedResult = {
      userId: mockUserId,
      contributionDays: 1,
      hadBadCommits: false,
    };

    expect(result).toEqual(expectedResult);
  });
});

describe("fetchAndCheckContributionsToRepository", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGithubContext = JSON.parse(JSON.stringify(baseMockGithubContext));
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

    const result = await fetchAndCheckContributionsToRepository(mockGithubContext, 5, 10, "https://repo/name");

    const expectedResult = {
      contributionValid: true,
      numberOfDays: 5,
    };

    expect(result).toEqual(expectedResult);
    expect(mockedGet).toHaveBeenCalledTimes(1); // We expect the axiosget to have been called 3 times (2 times it would get data, the 3rd time an empty list would be returned)
  });

  it("should validate a proper user when repo url ends with '/'", async () => {
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

    const result = await fetchAndCheckContributionsToRepository(mockGithubContext, 5, 10, "https://repo/name/");

    const expectedResult = {
      contributionValid: true,
      numberOfDays: 5,
    };

    expect(result).toEqual(expectedResult);
    expect(mockedGet).toHaveBeenCalledTimes(1); // We expect the axiosget to have been called 3 times (2 times it would get data, the 3rd time an empty list would be returned)
    expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/repos/repo/name/commits", {
      headers: {
        Authorization: `token ${mockGithubContext.github.accessToken}`,
      },
      params: {
        page: 1,
        per_page: 100,
        author: mockGithubContext.github.login,
      },
    });
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

    const result = await fetchAndCheckContributionsToRepository(mockGithubContext, 6, 1, "https://repo/name");

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

    const result = await fetchAndCheckContributionsToRepository(mockGithubContext, 6, 2, "https://repo/name");

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

    const result = await fetchAndCheckContributionsToRepository(mockGithubContext, 10, 10, "https://repo/name");

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

    await fetchAndCheckContributionsToRepository(mockGithubContext, 10, 1, "https://repo/name");

    expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/repos/repo/name/commits", {
      headers: {
        Authorization: `token ${mockGithubContext.github.accessToken}`,
      },
      params: {
        page: 1,
        per_page: 100,
        author: mockGithubContext.github.login,
      },
    });
  });
});

describe("fetchAndCheckCommitCountToRepository", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGithubContext = JSON.parse(JSON.stringify(baseMockGithubContext));
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

    const result = await fetchAndCheckCommitCountToRepository(mockGithubContext, 5, 10, "https://repo/name");

    const expectedResult = {
      contributionValid: true,
      commitCount: 5,
    };

    expect(result).toEqual(expectedResult);
    expect(mockedGet).toHaveBeenCalledTimes(1); // We expect the axiosget to have been called 3 times (2 times it would get data, the 3rd time an empty list would be returned)
  });

  it("should validate a proper user when repo url ends with '/'", async () => {
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

    const result = await fetchAndCheckCommitCountToRepository(mockGithubContext, 5, 10, "https://repo/name/");

    const expectedResult = {
      contributionValid: true,
      commitCount: 5,
    };

    expect(result).toEqual(expectedResult);
    expect(mockedGet).toHaveBeenCalledTimes(1); // We expect the axiosget to have been called 3 times (2 times it would get data, the 3rd time an empty list would be returned)
    expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/repos/repo/name/commits", {
      headers: {
        Authorization: `token ${mockGithubContext.github.accessToken}`,
      },
      params: {
        page: 1,
        per_page: 100,
        author: mockGithubContext.github.login,
      },
    });
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

    const result = await fetchAndCheckCommitCountToRepository(mockGithubContext, 6, 1, "https://repo/name");

    const expectedResult = {
      contributionValid: false,
      commitCount: 5,
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

    const result = await fetchAndCheckCommitCountToRepository(mockGithubContext, 6, 2, "https://repo/name");

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

    const result = await fetchAndCheckCommitCountToRepository(mockGithubContext, 10, 10, "https://repo/name");

    const expectedResult = {
      contributionValid: false,
      commitCount: 2,
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

    await fetchAndCheckCommitCountToRepository(mockGithubContext, 10, 1, "https://repo/name");

    expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/repos/repo/name/commits", {
      headers: {
        Authorization: `token ${mockGithubContext.github.accessToken}`,
      },
      params: {
        page: 1,
        per_page: 100,
        author: mockGithubContext.github.login,
      },
    });
  });

  it("should filter the commits in the github API by the author and cut-off date if specified", async () => {
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

    const cutOffDateStr = "2011-10-05T14:48:00.000Z";
    await fetchAndCheckCommitCountToRepository(mockGithubContext, 10, 1, "https://repo/name", new Date(cutOffDateStr));

    expect(mockedGet).toHaveBeenCalledWith("https://api.github.com/repos/repo/name/commits", {
      headers: {
        Authorization: `token ${mockGithubContext.github.accessToken}`,
      },
      params: {
        page: 1,
        per_page: 100,
        author: mockGithubContext.github.login,
        until: cutOffDateStr,
      },
    });
  });
});
