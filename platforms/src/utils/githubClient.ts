import { ProviderContext } from "@gitcoin/passport-types";

import axios from "axios";

import { handleProviderAxiosError } from "./handleProviderAxiosError.js";

const githubGraphEndpoint = "https://api.github.com/graphql";

export const MAX_YEARS_TO_CHECK = 3;
export const MAX_CONTRIBUTION_DAYS = 120;

export type GithubUserData = {
  userId: string;
  contributionDays: number;
  hadBadCommits: boolean;
};
export type GithubAccountData = { node_id: string; login: string };
export type GithubContext = ProviderContext & {
  github?: {
    userId?: string;
    login?: string;
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
    isPrivate: boolean;
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

function removeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

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
      if (node.repository.isPrivate) return;
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
                    isPrivate
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

export const fetchGithubData = async (
  accessToken: string,
  orgId?: string,
  maxContributionDays: number = MAX_CONTRIBUTION_DAYS,
  numYearsToCheck: number = MAX_YEARS_TO_CHECK
): Promise<GithubUserData> => {
  const now = new Date();
  let allUniqueContributionDates = new Set<string>();
  let userId;
  let hadBadCommits = false;
  let firstQuery = true;

  // Loop over the number of years
  for (let i = 0; i < numYearsToCheck; i++) {
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

      run = result.hasNextPage && allUniqueContributionDates.size < maxContributionDays;
    }

    if (allUniqueContributionDates.size >= maxContributionDays) break;
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
export const fetchAndCheckContributions = async (
  context: GithubContext,
  orgId?: string,
  maxContributionDays?: number,
  numYearsToCheck?: number
): Promise<GithubUserData> => {
  // We read from cache only if:
  // a. maxContributionDays and maxContributionDays have not been set (and defaults will be used).
  // This typically indicates that the function is used for the standard github stamp frp the
  // passport app)
  // b. a value has been stored in the cache
  if (
    maxContributionDays !== undefined ||
    numYearsToCheck !== undefined ||
    context.github?.contributionDays === undefined
  ) {
    if (!context.github) context.github = {};

    const accessToken = context.github.accessToken;

    // Fetch Github data
    const { userId, contributionDays, hadBadCommits } = await fetchGithubData(
      accessToken,
      orgId,
      maxContributionDays,
      numYearsToCheck
    );

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

export const getGithubUserData = async (context: GithubContext): Promise<GithubAccountData> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = context.github.accessToken;
  try {
    // Now that we have an access token fetch the user details
    const userRequest = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` },
    });

    const githubUserData: { node_id: string; login: string } = userRequest.data as { node_id: string; login: string };

    return {
      node_id: githubUserData.node_id,
      login: githubUserData.login,
    };
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
  numberOfDays: number,
  iterations = 3,
  orgURL: string
): Promise<GithubUserData> => {
  const orgLogin = removeTrailingSlash(orgURL).split("/").pop();

  const orgData = await getGithubOrgData(context, orgLogin);

  if (orgData.node_id) {
    return fetchAndCheckContributions(context, orgData.node_id, numberOfDays, iterations);
  }

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
  repoURL: string
): Promise<{
  contributionValid: boolean;
  numberOfDays?: number;
  errors?: string[];
}> => {
  const segments = removeTrailingSlash(repoURL).split("/");
  const repo = segments.pop();
  const owner = segments.pop();
  const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
  let page = 0;
  const per_page = 100;
  const daysWithCommits: Record<string, number> = {};
  const accessToken = context.github?.accessToken;
  let checkMoreCommits = true;
  const author = context.github.login;

  if (!author) {
    return {
      contributionValid: false,
      errors: ["Failed to check contribution to the repository, user login is not set"],
    };
  }

  try {
    // retrieve user's auth bearer token to authenticate client

    while (page < iterations && Object.keys(daysWithCommits).length < numberOfDays && checkMoreCommits) {
      page += 1;
      // Now that we have an access token fetch the user details
      const commitsResponse = await axios.get(commitsUrl, {
        headers: { Authorization: `token ${accessToken}` },
        params: { page, per_page, author },
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
    errors: ["Failed to check contribution to the repository"],
  };
};

export const fetchAndCheckCommitCountToRepository = async (
  context: GithubContext,
  expectedNumberOfCommits: number,
  iterations = 3,
  repoNameOrURL: string,
  cutOffDate?: Date
): Promise<{
  contributionValid: boolean;
  commitCount?: number;
  errors?: string[];
}> => {
  const segments = removeTrailingSlash(repoNameOrURL).split("/");
  const repo = segments.pop();
  const owner = segments.pop();
  const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
  let page = 0;
  const per_page = 100;
  const accessToken = context.github?.accessToken;
  let checkMoreCommits = true;
  const author = context.github.login;
  let commitCount = 0;

  if (!author) {
    return {
      contributionValid: false,
      errors: ["Failed to check contribution to the repository, user login is not set"],
    };
  }

  try {
    // retrieve user's auth bearer token to authenticate client

    while (page < iterations && commitCount < expectedNumberOfCommits && checkMoreCommits) {
      page += 1;
      // Now that we have an access token fetch the user details
      const commitsResponse = await axios.get(commitsUrl, {
        headers: { Authorization: `token ${accessToken}` },
        params: { page, per_page, author, until: cutOffDate?.toISOString() },
      });

      const commits = commitsResponse.data as RepoCommit[];
      checkMoreCommits = commits.length > 0; // We assume that there are no more commits if we received an empty list
      commitCount += commits.length;
    }

    return {
      contributionValid: commitCount >= expectedNumberOfCommits,
      commitCount: commitCount,
    };
  } catch (error) {
    handleProviderAxiosError(error, "Github error requesting access token", [accessToken]);
  }

  return {
    contributionValid: false,
    errors: ["Failed to check contribution to the repository"],
  };
};
