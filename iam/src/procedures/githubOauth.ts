import crypto from "crypto";
import axios from "axios";

export const getSessionKey = (): string => {
  return `github-${crypto.randomBytes(32).toString("hex")}`;
};

export type GithubTokenResponse = {
  access_token: string;
};

export type GithubFindMyUserResponse = {
  id?: string;
  login?: string;
  type?: string;
};

const requestAccessToken = async (code: string): Promise<string> => {
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

  if (tokenRequest.status != 200) {
    throw `Post for request returned status code ${tokenRequest.status} instead of the expected 200`;
  }

  const tokenResponse = tokenRequest.data as GithubTokenResponse;

  return tokenResponse.access_token;
};

export const requestFindMyUser = async (code: string): Promise<GithubFindMyUserResponse> => {
  // retrieve user's auth bearer token to authenticate client
  const accessToken = await requestAccessToken(code);

  // Now that we have an access token fetch the user details
  const userRequest = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });

  if (userRequest.status != 200) {
    throw `Get user request returned status code ${userRequest.status} instead of the expected 200`;
  }

  return userRequest.data as GithubFindMyUserResponse;
};
