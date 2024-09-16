import { ProviderContext } from "@gitcoin/passport-types";

import axios from "axios";

import { handleProviderAxiosError } from "./handleProviderAxiosError";

const githubGraphEndpoint = "https://api.github.com/graphql";

export const MAX_YEARS_TO_CHECK = 3;
export const MAX_CONTRIBUTION_DAYS = 120;

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

export type GithubOrgMetaData = {
  id?: number;
  login?: string;
  node_id?: string;
  errors?: string[];
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

export type RepoCommit = {
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
 * @endCursor string
 * @param accessToken
 * @param orgId - if specified this will only look at contributions to the specified org. This
 * is expected to be the `node_id` form the org object as returned by  https://api.github.com/orgs/<org>  for example
 * @returns
 */
export const queryFunc = async (
  fromDate: string,
  toDate: string,
  endCursor: string,
  accessToken: string,
  orgId?: string // This is expected to be the `node_id` form the org object as returned by  https://api.github.com/orgs/<org>  for example
): Promise<ParsedContributions & { userId: string }> => {
  try {
    /* eslint-disable */
    const query = `
      {
        viewer {
          id

          createdAt
          contributionsCollection(from: "${fromDate}" to: "${toDate}" organizationID:${orgId ? '"orgId"' : "null"}) {
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
    /* eslint-enable */

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
    console.error(error);
    handleProviderAxiosError(error, "Github error retrieving contributions", [accessToken]);
  }
};

export const fetchGithubData = async (accessToken: string, orgId?: string): Promise<GithubUserData> => {
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

      const result = await queryFunc(contributionRange.from, contributionRange.to, endCursor, accessToken, orgId);
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
export const fetchAndCheckContributions = async (context: GithubContext, orgId?: string): Promise<GithubUserData> => {
  if (context.github?.contributionDays === undefined) {
    if (!context.github) context.github = {};

    const accessToken = context.github.accessToken;

    // Fetch Github data
    const { userId, contributionDays, hadBadCommits } = await fetchGithubData(accessToken, orgId);

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

export const getGithubUserData = async (context: GithubContext): Promise<string> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = context.github.accessToken;
  try {
    // Now that we have an access token fetch the user details
    const userRequest = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` },
    });

    const githubUserData: { node_id: string } = userRequest.data as { node_id: string };
    return githubUserData.node_id;
  } catch (_error) {
    handleProviderAxiosError(_error, "Error getting getting github info", [accessToken]);
  }
};

/**
 *
 * @param code
 * @param context
 * @param orgLogin - thie is the login of the org to get data for (typically the last segment of the URL to get an orgs data https://api.github.com/orgs/${orgLogin})
 * @returns
 */
export const getGithubOrgData = async (context: GithubContext, orgLogin: string): Promise<GithubOrgMetaData> => {
  const accessToken = context.github?.accessToken;
  try {
    // Now that we have an access token fetch the user details
    const orgRequest = await axios.get(`https://api.github.com/orgs/${orgLogin}`, {
      headers: { Authorization: `token ${accessToken}` },
    });

    const orgData = orgRequest.data as GithubOrgMetaData;
    return orgData;
  } catch (error) {
    handleProviderAxiosError(error, "Error getting getting github info", [accessToken]);
  }
};

export const fetchAndCheckContributionsToOrganisation = async (
  context: GithubContext,
  numberOfDays: string,
  iterations = 3,
  orgLoginOrURL: string
): Promise<GithubUserData> => {
  const orgLogin = orgLoginOrURL.split("/").pop();
  const orgData = await getGithubOrgData(context, orgLogin);
  if (orgData.node_id) {
    return fetchAndCheckContributions(context, orgData.node_id);
  }
  // TODO: geri - fix this, probably throw error
  return {
    userId: context.github.userId,
    contributionDays: 0,
    hadBadCommits: true,
  };
};

export const fetchAndCheckContributionsToRepository = async (
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
  let checkMoreCommits = true;

  try {
    // retrieve user's auth bearer token to authenticate client

    while (page < iterations && Object.keys(daysWithCommits).length < numberOfDays && checkMoreCommits) {
      page += 1;
      // Now that we have an access token fetch the user details
      const commitsResponse = await axios.get(commitsUrl, {
        headers: { Authorization: `token ${accessToken}` },
        params: { page, per_page },
      });

      const commits = commitsResponse.data as RepoCommit[];
      checkMoreCommits = commits.length > 0; // We assume that there are no more commits if we received an empty list
      for (let i = 0; i < commits.length; i++) {
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
  } catch (error) {
    handleProviderAxiosError(error, "Github error requesting access token", [accessToken]);
  }

  return {
    contributionValid: false,
    errors: ["Failed to check contribution to the organisation"],
  };
};
