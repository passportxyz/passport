import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider } from "../../types.js";
import { getGithubUserData, requestAccessToken } from "../../utils/githubClient.js";
import { GithubContext } from "../../utils/githubClient.js";
import axios from "axios";

import {
  ConditionEvaluator,
  evaluateAND,
  evaluateOR,
  evaluateOrganisationContributor,
  evaluateRepositoryCommiter,
  evaluateRepositoryContributor,
} from "./condition.js";
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError.js";

export const githubConditionEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}account/customization/credential`;

type Condition = Record<string, object>;
type ConditionResponse = {
  data: {
    ruleset: {
      condition: Condition;
    };
  };
};

const getCondition = async (type: string, conditionName: string, conditionHash: string): Promise<Condition> => {
  try {
    const url = `${githubConditionEndpoint}/${type}%23${conditionName}%23${conditionHash}`;
    const response: ConditionResponse = await axios.get(url, {
      headers: { Authorization: process.env.SCORER_API_KEY },
    });
    return response.data.ruleset.condition;
  } catch (error) {
    handleProviderAxiosError(error, "custom stamp condition");
  }
};

export class CustomGithubProvider implements Provider {
  type = "DeveloperList";
  _options = {
    threshold: "1",
  };
  async verify(payload: RequestPayload, context: GithubContext): Promise<VerifiedPayload> {
    const errors: string[] = [];
    let record = undefined,
      valid = false;
    const { conditionName, conditionHash } = payload.proofs;
    let githubId: string | null = null;

    const condition = await getCondition(this.type, conditionName, conditionHash);

    // Call requestAccessToken to exchange the code for an access token and store it in the context
    await requestAccessToken(payload.proofs?.code, context);

    const githubAccountData = await getGithubUserData(context);
    githubId = githubAccountData.node_id;
    context.github.login = githubAccountData.login;

    const evaluator = new ConditionEvaluator({
      AND: evaluateAND,
      OR: evaluateOR,
      repository_contributor: evaluateRepositoryContributor,
      organisation_contributor: evaluateOrganisationContributor,
      repository_commit_count: evaluateRepositoryCommiter,
    });

    valid = await evaluator.evaluate(condition, context);

    if (valid && githubId && conditionName && conditionHash) {
      record = { id: githubId, conditionName, conditionHash };
    } else {
      errors.push("Your Github contributions did not qualify for this stamp.");
    }

    return {
      valid,
      errors,
      record,
    };
  }
}
