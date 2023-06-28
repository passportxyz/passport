import type { Provider } from "../../types";
import { RequestPayload, ProviderContext, VerifiedPayload } from "@gitcoin/passport-types";
import { fetchGithubUserData } from "../githubClient";

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

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    const githubUserData = await fetchGithubUserData(context, payload.proofs.code);
    const valid = checkAccountCreationDays(parseInt(this._options.threshold), githubUserData.createdAt);

    return {
      valid,
      error: githubUserData.errors,
      // double check record is sufficient, need to return address or userId?
      record: valid ? { id: `gte${this._options.threshold}GithubContributionActivity` } : undefined,
    };
  }
}
