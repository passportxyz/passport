export type GithubFindMyUserResponse = {
  id?: string;
  login?: string;
  type?: string;
};

export type GithubUserReposResponse = {
  hasOneFork?: boolean;
  hasOneStar?: boolean;
};

export type GithubRepoResponse = {
  owner?: {
    id?: string;
    type?: string;
  };
  fork?: boolean;
  forks_count?: number;
  stargazers_url?: string;
  stargazers_count?: number;
};

export type RepoResponse = {
  status?: number;
  data?: Array<GithubRepoResponse>;
};
