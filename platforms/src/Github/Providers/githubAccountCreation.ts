import { ProviderExternalVerificationError, type Provider } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { fetchGithubUserData, GithubContext } from "./githubClient";

export type GithubAccountCreationOptions = {
  threshold: string;
};

export const checkAccountCreationDays = (
  numberOfDays: number,
  createdAt: string
): { valid: boolean; errors?: string[] } => {
  const accountCreationDate = new Date(createdAt);
  const today = new Date();
  const differenceInTime = today.getTime() - accountCreationDate.getTime();
  const differenceInDays = differenceInTime / (1000 * 3600 * 24);

  if (differenceInDays >= numberOfDays) {
    return {
      valid: true,
      errors: undefined,
    };
  } else {
    return {
      valid: false,
      errors: [
        `Github account age, ${differenceInDays}, is less than the required ${numberOfDays} days (created at ${createdAt})`,
      ],
    };
  }
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
    const userDataErrors = [];
    let userDataValid = false,
      record = undefined;
    try {
      const { createdAt } = await fetchGithubUserData(context, payload.proofs.code);
      if (!createdAt) {
        userDataValid = false;
        userDataErrors.push("createdAt is undefined");
        return {
          valid: userDataValid,
          errors: userDataErrors,
          record: undefined,
        };
      }

      const { valid, errors } = checkAccountCreationDays(parseInt(this._options.threshold), createdAt);

      const githubId = context.github.id;

      if (valid) {
        record = { id: githubId };
      }

      return {
        valid,
        errors,
        record,
      };
    } catch (error: unknown) {
      throw new ProviderExternalVerificationError(
        `Github Account Creation verification error: ${JSON.stringify(error)}`
      );
    }
  }
}
