import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderError } from "../utils/errors";
import axios from "axios";

const githubGraphEndpoint = "https://api.github.com/graphql";

export type GithubContext = ProviderContext & {
  github?: {
    createdAt?: string;
    contributionData?: ContributionsCollection;
    accessToken?: string;
  };
};

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubUserData = {
  createdAt?: string;
  contributionData?: ContributionsCollection;
  errors?: string[];
};

interface GitHubResponse {
  data: {
    viewer: Viewer;
  };
  errors?: string[];
}

interface Viewer {
  createdAt: string;
  contributionsCollection: ContributionsCollection;
}

export interface ContributionsCollection {
  contributionCalendar: ContributionCalendar;
}

interface ContributionCalendar {
  totalContributions: number;
  weeks: Week[];
}

interface Week {
  contributionDays: ContributionDay[];
}

interface ContributionDay {
  contributionCount: number;
  date: string;
}

type GithubContributionResponse = {
  data?: GitHubResponse;
};

const queryFunc = async (fromDate: string, toDate: string, accessToken: string): Promise<Viewer> => {
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

// This will be called once whether from the account creation provider or from the contribution provider
// The second request is not needed for the account creation provider, but it is needed for the contribution provider
// Possible optimization is to only call firstYearCollection if coming from the account creation provider, then call secondYearCollection if needed
export const fetchGithubUserData = async (context: GithubContext, code: string): Promise<GithubUserData> => {
  const accessToken = await requestAccessToken(code, context);
  if (context.github.createdAt === undefined || context.github.contributionData === undefined) {
    try {
      const now = new Date();
      const oneYearAgo = new Date(new Date().setFullYear(now.getFullYear() - 1)).toISOString();
      const twoYearsAgo = new Date(new Date().setFullYear(now.getFullYear() - 2)).toISOString();

      const firstYearCollection = await queryFunc(twoYearsAgo, oneYearAgo, accessToken);
      const secondYearCollection = await queryFunc(oneYearAgo, now.toISOString(), accessToken);

      const contributionCollection = {
        contributionCalendar: {
          totalContributions:
            firstYearCollection.contributionsCollection.contributionCalendar.totalContributions +
            secondYearCollection.contributionsCollection.contributionCalendar.totalContributions,
          weeks: [
            ...firstYearCollection.contributionsCollection.contributionCalendar.weeks,
            ...secondYearCollection.contributionsCollection.contributionCalendar.weeks,
          ],
        },
      };

      if (!context.github) context.github = {};
      context.github.contributionData = contributionCollection;
      context.github.createdAt = firstYearCollection.createdAt ?? secondYearCollection.createdAt;

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
