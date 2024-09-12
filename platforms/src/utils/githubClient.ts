import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderError } from "./errors";
import axios from "axios";
import { handleProviderAxiosError } from "./handleProviderAxiosError";

const githubGraphEndpoint = "https://api.github.com/graphql";

export type GithubContext = ProviderContext & {
  github?: {
    code?: string;
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

export type GithubOrgMetaData = {
  id?: number;
  login?: string;
  node_id?: string;
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
  contributionCalendar: ContributionCalendar;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: Week[];
}

interface Week {
  contributionDays: ContributionDay[];
}

export interface ContributionDay {
  contributionCount: number;
  date: string;
}

type GithubContributionResponse = {
  data?: GitHubResponse;
};

type RepoCommit = {
  commit: {
    author: {
      date: string;
    };
  };
};

/**
 *
 * @param fromDate
 * @param toDate
 * @param accessToken
 * @param orgId - if specified this will only look at contributions to the specified org. This
 * is expected to be the `node_id` form the org object as returned by  https://api.github.com/orgs/<org>  for example
 * @returns
 */
export const queryFunc = async (
  fromDate: string,
  toDate: string,
  accessToken: string,
  orgId?: string // This is expected to be the `node_id` form the org object as returned by  https://api.github.com/orgs/<org>  for example
): Promise<Viewer> => {
  try {
    const query = `
      query {
        viewer {
          createdAt
          id
          contributionsCollection(from:"${fromDate}" to:"${toDate}" organizationID:"${orgId ? orgId : null}") {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;

    const result: GithubContributionResponse = await axios.post(
      githubGraphEndpoint,
      {
        query,
      },
      {
        headers: { Authorization: `token ${accessToken}` },
      }
    );

    return {
      contributionsCollection: result?.data?.data?.viewer?.contributionsCollection,
      createdAt: result?.data?.data?.viewer?.createdAt,
      id: result?.data?.data?.viewer?.id,
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

/**
 *
 * @param context
 * @param code
 * @param contributionRange
 * @param orgId - this is expected to be the `node_id` form the org object as returned by  https://api.github.com/orgs/<org>  for example
 * @returns
 */
export const fetchGithubUserData = async (
  context: GithubContext,
  contributionRange: ContributionRange = defaultContributionRange,
  orgId?: string
): Promise<GithubUserData> => {
  const accessToken = context.github?.accessToken;
  if (
    context.github.createdAt === undefined ||
    context.github.contributionData.contributionCollection.length < contributionRange.iteration + 1 ||
    context.github.id === undefined
  ) {
    try {
      const collection = await queryFunc(contributionRange.from, contributionRange.to, accessToken, orgId);
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
  numberOfDays: string,
  iterations = 3,
  orgId?: string
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
    const userData = await fetchGithubUserData(context, contributionRange, orgId);

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

/**
 *
 * @param code
 * @param context
 * @param orgLogin - thie is the login of the org to get data for (typically the last segment of the URL to get an orgs data https://api.github.com/orgs/${orgLogin})
 * @returns
 */
export const getGithubOrgData = async (context: GithubContext, orgLogin: string): Promise<GithubOrgMetaData> => {
  if (!context.github?.userData) {
    try {
      // retrieve user's auth bearer token to authenticate client
      const accessToken = context.github?.accessToken;

      // Now that we have an access token fetch the user details
      const userRequest = await axios.get(`https://api.github.com/orgs/${orgLogin}`, {
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
      handleProviderAxiosError(_error, "Error getting getting github info", [context.github?.accessToken]);
    }
  }
  return context.github.userData;
};

export const fetchAndCheckContributionsToOrganisation = async (
  context: GithubContext,
  numberOfDays: string,
  iterations = 3,
  orgLoginOrURL: string
): Promise<{ contributionValid: boolean; numberOfDays?: string; errors?: string[] }> => {
  const orgLogin = orgLoginOrURL.split("/").pop();
  const orgData = await getGithubOrgData(context, orgLogin);
  if (orgData.node_id) {
    return fetchAndCheckContributions(context, numberOfDays, iterations, orgData.node_id);
  }
  return {
    contributionValid: false,
    errors: ["Failed to check contribution to the organisation", ...orgData.errors],
  };
};

export const fetchAndCheckContributionsToRepozitory = async (
  context: GithubContext,
  numberOfDays: number,
  iterations = 3,
  repoNameOrURL: string
): Promise<{ contributionValid: boolean; numberOfDays?: number; errors?: string[] }> => {
  const segments = repoNameOrURL.split("/");
  const repo = segments.pop();
  const owner = segments.pop();
  const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
  let page = 0;
  const per_page = 100;
  const daysWithCommits: Record<string, number> = {};
  const accessToken = context.github?.accessToken;

  try {
    // retrieve user's auth bearer token to authenticate client

    while (page <= iterations && Object.keys(daysWithCommits).length < numberOfDays) {
      page += 1;
      // Now that we have an access token fetch the user details
      const commitsResponse = await axios.get(commitsUrl, {
        headers: { Authorization: `token ${accessToken}` },
        params: { page, per_page },
      });

      const commits = commitsResponse.data as RepoCommit[];
      for (var i = 0; i < commits.length; i++) {
        const commit = commits[i];
        const date = new Date(commit.commit.author.date).toISOString().split("T")[0];

        if (!daysWithCommits[date]) {
          daysWithCommits[date] = 1;
        } else {
          daysWithCommits[date] += 1;
        }
      }
    }

    return {
      contributionValid: Object.keys(daysWithCommits).length >= numberOfDays,
      numberOfDays: Object.keys(daysWithCommits).length,
    };
  } catch (_error) {
    const error = _error as ProviderError;
    if (error?.response?.status === 429) {
      return {
        contributionValid: false,
        errors: ["Error getting getting github info", "Rate limit exceeded"],
      };
    }
    handleProviderAxiosError(_error, "Error getting getting github info", [accessToken]);
  }

  return {
    contributionValid: false,
    errors: ["Failed to check contribution to the organisation"],
  };
};
