import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import { fetchAndCheckContributionsToOrganisation, requestAccessToken } from "../../utils/githubClient";
import { GithubContext } from "../../utils/githubClient";
import { strict } from "assert";
import {
  ConditionEvaluator,
  evaluateAND,
  evaluateOR,
  evaluateOrganisationContributor,
  evaluateRepozitoryContributor,
} from "./condition";

export const githubConditionEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}account/custom-github-stamps/condition`;
const apiKey = process.env.SCORER_API_KEY;

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
        // Call requestAccessToken to exchange the code for an access token and store it in the context
        await requestAccessToken(payload.proofs?.code, context);

        const evaluator = new ConditionEvaluator({
          AND: evaluateAND,
          OR: evaluateOR,
          repozitory_contributor: evaluateRepozitoryContributor,
          organisation_contributor: evaluateOrganisationContributor,
        });

        const condition = {
          contributed: {
            repo: "https://github.com/passportxyz",
            threshold: 10,
          },
        };
        evaluator.evaluate(condition, context);

        contributionResult = await fetchAndCheckContributionsToOrganisation(
          context,
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
