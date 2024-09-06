import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderError } from "../../utils/errors";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

const githubGraphEndpoint = "https://api.github.com/graphql";

export type GithubContext = ProviderContext & {
  github?: {
    createdAt?: string;
    id?: string;
    contributionData?: {
      contributionCollection: ContributionsCollection[];
      iteration: number;
    };
    accessToken?: string;
    userData?: GithubUserMetaData;
  };
};

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubUserMetaData = {
  public_repos?: number;
  id?: number;
  login?: string;
  followers?: number;
  type?: string;
  errors?: string[];
};

export type GithubUserData = {
  createdAt?: string;
  id?: string;
  contributionData?: {
    contributionCollection: ContributionsCollection[];
    iteration: number;
  };
  userData?: GithubUserMetaData;
  errors?: string[];
};

interface GitHubResponse {
  data: {
    viewer: Viewer;
  };
  errors?: string[];
}

export interface Viewer {
  createdAt: string;
  id?: string;
  contributionsCollection: ContributionsCollection;
}

export interface ContributionsCollection {
  commitContributionsByRepository: CommitContributionsByRepository[];
}

interface CommitContributionsByRepository {
  contributions: {
    pageInfo: {
      endCursor: string | null;
      hasNextPage: boolean;
    };
    nodes: ContributionNode[];
  };
}

interface ContributionNode {
  commitCount: number;
  occurredAt: string;
  repository: {
    name: string;
    createdAt: string;
  };
}

type GithubContributionResponse = {
  data?: GitHubResponse;
};

/*
   // Bad (faked) repo
 {
  "data": {
    "viewer": {
      "createdAt": "2016-06-13T12:20:43Z",
      "id": "MDQ6VXNlcjE5OTA4NzYy",
      "contributionsCollection": {
        "commitContributionsByRepository": [
          {
            "contributions": {
              "nodes": [
                {
                  "commitCount": 2,
                  "occurredAt": "1980-01-01T08:00:00Z",
                  "repository": {
                    "createdAt": "2024-09-04T14:13:54Z"
                  }
                }
              ]
            }
          },
          {
            "contributions": {
              "nodes": [
                {
                  "commitCount": 1,
                  "occurredAt": "1980-01-01T08:00:00Z",
                  "repository": {
                    "createdAt": "2024-09-04T14:36:32Z"
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
}

// Good, first page
{
  "data": {
    "viewer": {
      "createdAt": "2016-06-13T12:20:43Z",
      "id": "MDQ6VXNlcjE5OTA4NzYy",
      "contributionsCollection": {
        "commitContributionsByRepository": [
          {
            "contributions": {
              "pageInfo": {
                "endCursor": "MQ",
                "hasNextPage": true
              },
              "nodes": [
                {
                  "commitCount": 1,
                  "occurredAt": "2024-09-06T07:00:00Z",
                  "repository": {
                    "name": "passport",
                    "createdAt": "2022-03-14T17:57:02Z"
                  }
                }
              ]
            }
          },
          {
            "contributions": {
              "pageInfo": {
                "endCursor": "MQ",
                "hasNextPage": true
              },
              "nodes": [
                {
                  "commitCount": 3,
                  "occurredAt": "2024-09-04T07:00:00Z",
                  "repository": {
                    "name": "passport-scorer",
                    "createdAt": "2022-11-18T18:16:06Z"
                  }
                }
              ]
            }
          },
          {
            "contributions": {
              "pageInfo": {
                "endCursor": "MQ",
                "hasNextPage": false
              },
              "nodes": [
                {
                  "commitCount": 2,
                  "occurredAt": "2024-09-04T07:00:00Z",
                  "repository": {
                    "name": "passport-scroll-badge-service",
                    "createdAt": "2024-06-28T09:02:44Z"
                  }
                }
              ]
            }
          },
          {
            "contributions": {
              "pageInfo": {
                "endCursor": "MQ",
                "hasNextPage": false
              },
              "nodes": [
                {
                  "commitCount": 2,
                  "occurredAt": "2024-09-04T07:00:00Z",
                  "repository": {
                    "name": "id-staking-v2-app",
                    "createdAt": "2024-03-07T08:47:47Z"
                  }
                }
              ]
            }
          }
        ]
      }
    }
  }
}

// Good, second page
{
  "data": {
    "viewer": {
      "createdAt": "2016-06-13T12:20:43Z",
      "id": "MDQ6VXNlcjE5OTA4NzYy",
      "contributionsCollection": {
        "commitContributionsByRepository": [
          {
            "contributions": {
              "pageInfo": {
                "endCursor": "Mw",
                "hasNextPage": true
              },
              "nodes": [
                {
                  "commitCount": 2,
                  "occurredAt": "2024-09-04T07:00:00Z",
                  "repository": {
                    "name": "passport",
                    "createdAt": "2022-03-14T17:57:02Z"
                  }
                }
              ]
            }
          },
          {
            "contributions": {
              "pageInfo": {
                "endCursor": null,
                "hasNextPage": false
              },
              "nodes": []
            }
          },
          {
            "contributions": {
              "pageInfo": {
                "endCursor": null,
                "hasNextPage": false
              },
              "nodes": []
            }
          },
          {
            "contributions": {
              "pageInfo": {
                "endCursor": null,
                "hasNextPage": false
              },
              "nodes": []
            }
          }
        ]
      }
    }
  }
}
*/

export const queryFunc = async (
  fromDate: string,
  toDate: string,
  accessToken: string,
  endCursor: string
): Promise<Viewer> => {
  try {
    const query = `
      {
        viewer {
          createdAt
          id
          contributionsCollection(from: "${fromDate}", to: "${toDate}") {
            commitContributionsByRepository (maxRepositories: 100) {
              contributions (first: 100, after: "${endCursor}") {
                pageInfo {
                  endCursor
                  hasNextPage
                }
                nodes {
                  commitCount
                  occurredAt
                  repository {
                    name
                    createdAt
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response: GithubContributionResponse = await axios.post(
      githubGraphEndpoint,
      {
        query,
      },
      {
        headers: { Authorization: `token ${accessToken}` },
      }
    );

    const result = response?.data?.data?.viewer;

    return {
      contributionsCollection: result?.contributionsCollection,
      createdAt: result?.createdAt,
      id: result?.id,
    };
  } catch (error) {
    handleProviderAxiosError(error, "Github error retrieving contributions", [accessToken]);
  }
};

export type ContributionRange = {
  from: string;
  to: string;
  iteration: number;
};

export const now = new Date();

const defaultContributionRange: ContributionRange = {
  from: new Date(new Date().setFullYear(now.getFullYear() - 1)).toISOString(),
  to: now.toISOString(),
  iteration: 0,
};

export const fetchGithubUserData = async (
  context: GithubContext,
  code: string,
  contributionRange: ContributionRange = defaultContributionRange
): Promise<GithubUserData> => {
  const accessToken = await requestAccessToken(code, context);
  if (
    context.github.createdAt === undefined ||
    context.github.contributionData.contributionCollection.length < contributionRange.iteration + 1 ||
    context.github.id === undefined
  ) {
    try {
      const collection = await queryFunc(contributionRange.from, contributionRange.to, accessToken);
      const existingCollection = context?.github?.contributionData?.contributionCollection || [];

      if (!context.github) context.github = {};
      context.github.contributionData = {
        contributionCollection: [...existingCollection, collection.contributionsCollection],
        iteration: contributionRange.iteration,
      };
      context.github.createdAt = collection.createdAt;
      context.github.id = collection.id;
      return {
        contributionData: context.github.contributionData,
        createdAt: context.github.createdAt,
        id: context.github.id,
      };
    } catch (_error) {
      const error = _error as ProviderError;
      if (error?.response?.status === 429) {
        return {
          errors: ["Error getting getting github info", "Rate limit exceeded"],
        };
      }
      return {
        errors: ["Error getting getting github info", `${error?.message}`],
      };
    }
  }
  return {
    contributionData: context.github.contributionData,
    createdAt: context.github.createdAt,
    id: context.github.id,
  };
};

export const requestAccessToken = async (code: string, context: GithubContext): Promise<string> => {
  if (!context.github?.accessToken) {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      // Exchange the code for an access token
      const tokenRequest = await axios.post(
        `https://github.com/login/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
        {},
        {
          headers: { Accept: "application/json" },
        }
      );

      const tokenResponse = tokenRequest.data as GithubTokenResponse;

      if (!context.github) context.github = {};
      context.github.accessToken = tokenResponse.access_token;
    } catch (error) {
      handleProviderAxiosError(error, "Github error requesting access token", [code]);
    }
  }

  return context.github.accessToken;
};

export const fetchAndCheckContributions = async (
  context: GithubContext,
  code: string,
  numberOfDays: string,
  iterations = 3
): Promise<{ contributionValid: boolean; numberOfDays?: string; errors?: string[] }> => {
  let contributionValid = false;
  // Initialize an object to keep track of unique contribution days
  const totalContributionsCalendar: { [key: string]: ContributionDay } = {};

  // Loop over the number of years specified in iterations
  for (let i = 0; i < iterations; i++) {
    // Define the range of dates for each iteration
    const contributionRange: ContributionRange = {
      from: new Date(new Date().setFullYear(now.getFullYear() - (i + 1))).toISOString(),
      to: new Date(new Date().setFullYear(now.getFullYear() - i)).toISOString(),
      iteration: i,
    };

    // Fetch Github user data
    const userData = await fetchGithubUserData(context, code, contributionRange);

    // If there are errors, return them
    if (userData.errors) {
      return { contributionValid: false, errors: userData.errors };
    }

    // If there are contribution data, process them
    if (userData.contributionData) {
      // Loop over each contribution collection
      userData.contributionData.contributionCollection.forEach((collection) => {
        // Loop over each week
        collection.contributionCalendar.weeks.forEach((week) => {
          // Loop over each day
          week.contributionDays.forEach((day) => {
            // Only count the day if there were contributions and it's not already counted
            if (day.contributionCount > 0) {
              totalContributionsCalendar[day.date] = day;
            }
          });
        });
      });

      // Count the unique contribution days and compare with the provided numberOfDays
      contributionValid = Object.keys(totalContributionsCalendar).length >= parseInt(numberOfDays);

      // If the number of contribution days is valid or we're not at the first iteration, avoid Github rate limit
      if (contributionValid || i > 0) await avoidGithubRateLimit();

      // If the number of contribution days is valid, break the loop
      if (contributionValid) break;
    }
  }

  return { contributionValid, numberOfDays };
};

export const getGithubUserData = async (code: string, context: GithubContext): Promise<GithubUserMetaData> => {
  if (!context.github?.userData) {
    try {
      // retrieve user's auth bearer token to authenticate client
      const accessToken = await requestAccessToken(code, context);

      // Now that we have an access token fetch the user details
      const userRequest = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${accessToken}` },
      });

      if (!context.github) context.github = {};
      context.github.userData = userRequest.data;
    } catch (_error) {
      const error = _error as ProviderError;
      if (error?.response?.status === 429) {
        return {
          errors: ["Error getting getting github info", "Rate limit exceeded"],
        };
      }
      handleProviderAxiosError(_error, "Error getting getting github info", [code]);
    }
  }
  return context.github.userData;
};

// For everything after the initial user load, we need to avoid the secondary rate
// limit by waiting 1 second between requests
export const avoidGithubRateLimit = async (): Promise<void> => {
  if (process.env.NODE_ENV === "test") return;

  await new Promise((resolve) => setTimeout(resolve, 1000));
};
