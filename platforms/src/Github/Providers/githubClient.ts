import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderError } from "../../utils/errors";
import axios from "axios";

const githubGraphEndpoint = "https://api.github.com/graphql";

export type GithubContext = ProviderContext & {
  github?: {
    createdAt?: string;
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

export const queryFunc = async (fromDate: string, toDate: string, accessToken: string): Promise<Viewer> => {
  const query = `
    query {
      viewer {
        createdAt
        contributionsCollection(from: "${fromDate}", to: "${toDate}") {
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
  };
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
    context.github.contributionData.contributionCollection.length < contributionRange.iteration + 1
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

      return {
        contributionData: context.github.contributionData,
        createdAt: context.github.createdAt,
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
  };
};

export const requestAccessToken = async (code: string, context: GithubContext): Promise<string> => {
  if (!context.github?.accessToken) {
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
  }

  return context.github.accessToken;
};

export const fetchAndCheckContributions = async (
  context: GithubContext,
  code: string,
  numberOfDays: string,
  iterations = 3
): Promise<{ contributionValid: boolean; errors?: string[] }> => {
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

  return { contributionValid };
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
      return {
        errors: ["Error getting getting github info", `${error?.message}`],
      };
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
