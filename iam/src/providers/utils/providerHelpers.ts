// ----- Types
import type {
  GithubFindMyUserResponse,
  GithubUserRepoResponseData,
  GithubRepoRequestResponse,
  VerifiedGithubRepoData,
} from "../types/githubTypes";

// ----- HTTP Client
import axios from "axios";

// Returns object containing user's github repo data
// if the repo owner and the Passport user are the same,
// and the repo isn't a fork, and the fork count is greater than 1
export const checkUserRepoForks = (
  userData: GithubFindMyUserResponse,
  userRepoData: GithubRepoRequestResponse["data"]
): VerifiedGithubRepoData => {
  const verifiedGithubRepoData: VerifiedGithubRepoData = {};

  userRepoData.findIndex((repo: GithubUserRepoResponseData) => {
    // Check to see if the authenticated GH user is the same as the repo owner,
    // if the repo is not a fork of another repo, and if the repo fork count is gte 1
    if (userData.id === repo.owner.id && !repo.fork && repo.forks_count >= 1) {
      verifiedGithubRepoData.owner_id = repo.owner.id;
      verifiedGithubRepoData.forks_count = repo.forks_count;
    }
    verifiedGithubRepoData.owner_id = repo.owner.id;
    verifiedGithubRepoData.forks_count = repo.forks_count;
  });

  return verifiedGithubRepoData;
};

// Returns object containing user's github repo data
// if the Passport user is not the same as the user
// who starred the repo and the repo has 1 or more stars
export const checkUserRepoStars = (
  userData: GithubFindMyUserResponse,
  userRepoData: GithubRepoRequestResponse["data"]
): VerifiedGithubRepoData => {
  const verifiedGithubRepoData: VerifiedGithubRepoData = {};
  userRepoData.findIndex((repo: GithubUserRepoResponseData) => {
    // First check if the GitHub user is the same as the owner of the repo
    if (userData.id === repo.owner.id && repo.stargazers_count > 1) {
      verifiedGithubRepoData.owner_id = repo.owner.id;
      verifiedGithubRepoData.stargazers_count = repo.stargazers_count;
    } else if (userData.id === repo.owner.id && repo.stargazers_count === 1) {
      // Check if the owner of the repo is the same as the only stargazer -- if they're different, return true | if they're the same, return false
      try {
        // check if the stargazer's user id is equal to the authenticated user's id
        async (): Promise<void> => {
          const stargazerData: [] = await axios.get(repo.stargazers_url);
          const stargazersItem: Record<string, unknown> = stargazerData.find(
            (stargazerObject: GithubUserRepoResponseData["owner"]) => {
              stargazerObject.type === userData.type;
            }
          );
          if (stargazersItem.id !== userData.id) {
            verifiedGithubRepoData.owner_id = repo.owner.id;
            verifiedGithubRepoData.stargazers_count = repo.stargazers_count;
          }
        };
      } catch {
        throw "Something went wrong when trying to fetch the stargazer data";
      }
    }
    verifiedGithubRepoData.owner_id = repo.owner.id;
    verifiedGithubRepoData.stargazers_count = repo.stargazers_count;
  });

  return verifiedGithubRepoData;
};
