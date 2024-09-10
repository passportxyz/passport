import { ProviderContext } from "@gitcoin/passport-types";
import axios from "axios";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";
import { MAX_CONTRIBUTION_DAYS } from "../Providers-config";

const githubGraphEndpoint = "https://api.github.com/graphql";

export const MAX_YEARS_TO_CHECK = 3;

export type GithubUserData = { userId: string; contributionDays: number; hadBadCommits: boolean };

export type GithubContext = ProviderContext & {
  github?: {
    userId?: string;
    contributionDays?: number;
    accessToken?: string;
    hadBadCommits?: boolean;
  };
};

export type GithubTokenResponse = {
  access_token: string;
};

export interface Viewer {
  id: string;
  createdAt: string;
  contributionsCollection: {
    commitContributionsByRepository: CommitContributionsByRepository[];
  };
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
    createdAt: string;
  };
}

export type GithubContributionResponse = {
  data?: {
    data: {
      viewer: Viewer;
    };
  };
};

type ParsedContributions = {
  hasNextPage: boolean;
  endCursor: string;
  uniqueContributionDates: Set<string>;
  hadBadCommits?: boolean;
};

export type ContributionRange = {
  from: string;
  to: string;
  iteration: number;
};

const parseContributions = ({
  commitContributionsByRepository,
  userCreatedAt,
}: {
  commitContributionsByRepository: CommitContributionsByRepository[];
  userCreatedAt: Date;
}): ParsedContributions => {
  let hasNextPage = false;
  let endCursor = "";
  const uniqueContributionDates = new Set<string>();
  let hadBadCommits = false;

  commitContributionsByRepository.forEach((repoCommits) => {
    const { pageInfo, nodes } = repoCommits.contributions;
    if (pageInfo.hasNextPage) {
      hasNextPage = true;
      endCursor = pageInfo.endCursor;
    }
    nodes.forEach((node) => {
      const commitDate = new Date(node.occurredAt);
      const repoCreatedAt = new Date(node.repository.createdAt);
      if (commitDate >= repoCreatedAt && commitDate >= userCreatedAt) {
        uniqueContributionDates.add(commitDate.toDateString());
      } else {
        hadBadCommits = true;
      }
    });
  });

  return {
    hasNextPage,
    endCursor,
    uniqueContributionDates,
    hadBadCommits,
  };
};

export const queryFunc = async (
  fromDate: string,
  toDate: string,
  endCursor: string,
  accessToken: string
): Promise<ParsedContributions & { userId: string }> => {
  try {
    const query = `
      {
        viewer {
          id
          createdAt
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

    const commitContributionsByRepository = result.contributionsCollection.commitContributionsByRepository;
    const userCreatedAt = new Date(result.createdAt);
    const userId = result.id;

    return {
      ...parseContributions({
        commitContributionsByRepository,
        userCreatedAt,
      }),
      userId,
    };
  } catch (error) {
    handleProviderAxiosError(error, "Github error retrieving contributions", [accessToken]);
  }
};

export const fetchGithubData = async (accessToken: string): Promise<GithubUserData> => {
  const now = new Date();
  let allUniqueContributionDates = new Set<string>();
  let userId;
  let hadBadCommits = false;
  let firstQuery = true;

  // Loop over the number of years
  for (let i = 0; i < MAX_YEARS_TO_CHECK; i++) {
    // Define the range of dates for each iteration
    const contributionRange: ContributionRange = {
      from: new Date(new Date().setFullYear(now.getFullYear() - (i + 1))).toISOString(),
      to: new Date(new Date().setFullYear(now.getFullYear() - i)).toISOString(),
      iteration: i,
    };

    let endCursor = "";
    let run = true;
    while (run) {
      if (firstQuery) {
        firstQuery = false;
      } else {
        await avoidGithubRateLimit();
      }

      const result = await queryFunc(contributionRange.from, contributionRange.to, endCursor, accessToken);
      userId = result.userId;
      endCursor = result.endCursor;
      allUniqueContributionDates = new Set([...allUniqueContributionDates, ...result.uniqueContributionDates]);
      if (result.hadBadCommits) hadBadCommits = true;

      run = result.hasNextPage && allUniqueContributionDates.size < MAX_CONTRIBUTION_DAYS;
    }

    if (allUniqueContributionDates.size >= MAX_CONTRIBUTION_DAYS) break;
  }

  return {
    userId,
    hadBadCommits,
    contributionDays: allUniqueContributionDates.size,
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

export const fetchAndCheckContributions = async (context: GithubContext, code: string): Promise<GithubUserData> => {
  if (context.github?.contributionDays === undefined) {
    if (!context.github) context.github = {};

    const accessToken = await requestAccessToken(code, context);

    // Fetch Github data
    const { userId, contributionDays, hadBadCommits } = await fetchGithubData(accessToken);

    context.github.contributionDays = contributionDays;
    context.github.userId = userId;
    context.github.hadBadCommits = hadBadCommits;
  }

  return {
    userId: context.github.userId,
    contributionDays: context.github.contributionDays,
    hadBadCommits: context.github.hadBadCommits,
  };
};

// For everything after the initial request, we need to avoid the secondary rate
// limit by waiting 1 second between requests
export const avoidGithubRateLimit = async (): Promise<void> => {
  if (process.env.NODE_ENV === "test") return;

  await new Promise((resolve) => setTimeout(resolve, 1000));
};
