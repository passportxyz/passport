import { ProviderContext } from "@gitcoin/passport-types";
import { ProviderError } from "../utils/errors";
import axios from "axios";

const githubGraphEndpoint = "https://api.github.com/graphql";

export type GithubContext = ProviderContext & {
  github?: {
    userData?: ContributionsCollection;
    accessToken?: string;
  };
};

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubContributionData = {
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

interface ContributionsCollection {
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

const queryFunc = async (fromDate: string, toDate: string, accessToken: string) => {
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

  return result?.data?.data?.viewer?.contributionsCollection;
};

export const fetchGithubUserContributions = async (context: GithubContext): Promise<GithubContributionData> => {
  if (!context.github?.userData) {
    try {
      const now = new Date();
      const oneYearAgo = new Date(new Date().setFullYear(now.getFullYear() - 1)).toISOString();
      const twoYearsAgo = new Date(new Date().setFullYear(now.getFullYear() - 2)).toISOString();

      const firstYearCollection = await queryFunc(twoYearsAgo, oneYearAgo, context.github.accessToken);
      const secondYearCollection = await queryFunc(oneYearAgo, now.toISOString(), context.github.accessToken);

      const contributionCollection = {
        contributionCalendar: {
          totalContributions:
            firstYearCollection.contributionCalendar.totalContributions +
            secondYearCollection.contributionCalendar.totalContributions,
          weeks: [
            ...firstYearCollection.contributionCalendar.weeks,
            ...secondYearCollection.contributionCalendar.weeks,
          ],
        },
      };

      if (!context.github) context.github = {};
      context.github.userData = contributionCollection;

      return {
        contributionData: context.github.userData,
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
    contributionData: context.github.userData,
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
