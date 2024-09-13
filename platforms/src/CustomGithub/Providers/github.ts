import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError, type Provider } from "../../types";
import {
  fetchAndCheckContributionsToOrganisation,
  getGithubUserData,
  requestAccessToken,
} from "../../utils/githubClient";
import { GithubContext } from "../../utils/githubClient";
import axios from "axios";

import {
  ConditionEvaluator,
  evaluateAND,
  evaluateOR,
  evaluateOrganisationContributor,
  evaluateRepositoryContributor,
} from "./condition";

export const githubConditionEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}account/custom-github-stamps/condition`;
const apiKey = process.env.SCORER_API_KEY;

type ConditionResponse = {
  data: {
    condition: Record<string, object>;
  };
};

export class CustomGithubProvider implements Provider {
  type = "Github";
  _options = {
    threshold: "1",
  };
  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    try {
      const errors: string[] = [];
      let record = undefined,
        valid = false;
      const { conditionName } = payload.proofs;
      let githubId: string | null = null;

      try {
        // Query the condition that needs to be verified from the server
        const response: ConditionResponse = await axios.get(`${githubConditionEndpoint}/${conditionName}`, {
          headers: { Authorization: process.env.CGRANTS_API_TOKEN },
        });

        // Call requestAccessToken to exchange the code for an access token and store it in the context
        await requestAccessToken(payload.proofs?.code, context);

        githubId = await getGithubUserData(context);

        const evaluator = new ConditionEvaluator({
          AND: evaluateAND,
          OR: evaluateOR,
          repository_contributor: evaluateRepositoryContributor,
          organisation_contributor: evaluateOrganisationContributor,
        });

        valid = await evaluator.evaluate(response.data.condition, context);
      } catch (e) {
        valid = false;

        errors.push(String(e));
      }

      if (valid && githubId && conditionName) {
        record = { id: githubId, conditionName: conditionName };
      } else {
        errors.push("Your Github contributions did not qualify for this stamp.");
      }

      return {
        valid,
        errors,
        record,
      };
    } catch (_error: unknown) {
      const error = _error as Error;
      throw new ProviderExternalVerificationError(`Error verifying Github contributions: ${error?.message}`);
    }
  }
}
