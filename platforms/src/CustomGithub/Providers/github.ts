import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import { fetchAndCheckContributionsToOrganisation } from "../../Github/Providers/githubClient";
import { GithubContext } from "../../Github/Providers/githubClient";

export const githubConditionEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}account/custom-github-stamps/condition`;
const apiKey = process.env.SCORER_API_KEY;

export interface AllowListResponse {
  data: {
    is_member: boolean;
  };
}

export class CustomGithubProvider implements Provider {
  type = "Github";
  _options = {
    threshold: "1",
  };
  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    try {
      const errors: string[] = [];
      let record = undefined,
        valid = false,
        contributionResult;

      try {
        contributionResult = await fetchAndCheckContributionsToOrganisation(
          context,
          payload.proofs.code,
          this._options.threshold,
          3,
          "https://github.com/passportxyz"
        );
      } catch (e) {
        valid = false;
        errors.push(String(e));
      }

      valid = contributionResult.contributionValid;
      const githubId = context.github.id;

      if (valid) {
        record = { id: githubId };
      } else {
        errors.push("Your Github contributions did not qualify for this stamp.");
      }

      return {
        valid,
        errors,
        record,
      };
    } catch (error: unknown) {
      throw new ProviderExternalVerificationError(`Error verifying Github contributions: ${JSON.stringify(error)}`);
    }
  }
}
