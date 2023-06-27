import axios from "axios";

const githubGraphEndpoint = "https://api.github.com/graphql";

interface GitHubResponse {
  data: {
    viewer: Viewer;
  };
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

export const fetchGithubUserContributions = async (): Promise<ContributionsCollection> => {
  const twoYearsAgo = `${
    new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString().split("T")[0]
  }T00:00:00Z`;

  const result: GithubContributionResponse = await axios.post(githubGraphEndpoint, {
    query: `
      query { 
        viewer {
          createdAt
          contributionsCollection(from: ${twoYearsAgo}) {
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
    `,
  });
  return result?.data?.data?.viewer?.contributionsCollection;
};
