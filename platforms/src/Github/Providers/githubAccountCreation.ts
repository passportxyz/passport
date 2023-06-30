import type { Provider } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { fetchGithubUserData, GithubContext } from "./githubClient";

export type GithubAccountCreationOptions = {
  threshold: string;
};

export const checkAccountCreationDays = (numberOfDays: number, createdAt: string): boolean => {
  const accountCreationDate = new Date(createdAt);
  const today = new Date();
  const differenceInTime = today.getTime() - accountCreationDate.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);
  return differenceInDays >= numberOfDays;
};

export class GithubAccountCreationProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  _options = {
    threshold: "1",
  };

  constructor(options: GithubAccountCreationOptions) {
    this._options = { ...this._options, ...options };
    this.type = `githubAccountCreationGte#${this._options.threshold}`;
  }

  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    const githubUserData = await fetchGithubUserData(context, payload.proofs.code);
    const valid = checkAccountCreationDays(parseInt(this._options.threshold), githubUserData.createdAt);

    const githubId = context.github.id;

    return {
      valid,
      error: githubUserData.errors,
      record: valid ? { id: githubId } : undefined,
    };
  }
}
