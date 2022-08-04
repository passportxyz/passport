// ----- Types
import type { GithubFindMyUserResponse, GithubRepoResponse, RepoResponse } from "../types/githubTypes";

// ----- HTTP Client
import axios from "axios";

// Returning true if the repo owner and the Passport user are the same,
// and the repo isn't a fork, and the fork count is greater than 1, otherwise, returning false
export const checkUserRepoForks = (userData: GithubFindMyUserResponse, userRepoData: RepoResponse["data"]): boolean => {
  const hasOneFork = userRepoData.findIndex((repo: GithubRepoResponse) => {
    // Check to see if the authenticated GH user is the same as the repo owner,
    // if the repo is not a fork of another repo, and if the repo fork count is gte 1
    return userData.id === repo.owner.id && !repo.fork && repo.forks_count >= 1 ? true : false;
  });

  return hasOneFork === -1 ? false : true;
};

// Returning true if the Passport user is not the same as the user
// who starred the repo, and the repo has more than 1 star, otherwise returning false
export const checkUserRepoStars = (userData: GithubFindMyUserResponse, userRepoData: RepoResponse["data"]): boolean => {
  const hasOneStar = userRepoData.findIndex((repo: GithubRepoResponse) => {
    // First check if the GitHub user is the same as the owner of the repo
    if (userData.id === repo.owner.id) {
      // Check if the owner of the repo is the same as the only stargazer -- if they're different, return true | if they're the same, return false
      if (repo.stargazers_count === 1) {
        try {
          // check if the stargazers url's user's id is equal to the userData.id
          const fetchedData = async (): Promise<boolean> => {
            const starData: [] = await axios.get(repo.stargazers_url);
            const ownerItem: Record<string, unknown> = starData.find((starObject: GithubRepoResponse["owner"]) => {
              starObject.type === userData.type;
            });

            return ownerItem.id !== userData.id;
          };
          return fetchedData;
        } catch {
          throw "Something went wrong when trying to fetch the stargazers front";
        }
        // Check if the user's repo stargazer count is greater than 1
      } else if (repo.stargazers_count > 1) {
        return true;
      } else {
        return false;
      }
    }
  });

  return hasOneStar === -1 ? false : true;
};
