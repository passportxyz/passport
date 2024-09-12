import {
  fetchAndCheckContributionsToOrganisation,
  fetchAndCheckContributionsToRepository,
} from "../../utils/githubClient";

type OperatorHandler = (condition: any, evaluator: ConditionEvaluator, context: any) => Promise<boolean>;

export class ConditionEvaluator {
  conditionOperators: Record<string, OperatorHandler> = {};

  constructor(conditionOperators: Record<string, OperatorHandler>) {
    this.conditionOperators = conditionOperators;
  }

  getEvaluator(operator: string): OperatorHandler {
    const ret = this.conditionOperators[operator];
    if (!ret) {
      throw new Error(`Operator ${operator} not supported`);
    }
    return ret;
  }

  async evaluate(condition: Record<string, object>, context: any): Promise<boolean> {
    console.log("geri evaluate", condition);
    const operatorNames = Object.keys(condition);
    if (operatorNames.length !== 1) {
      throw new Error(`Only 1 operator (attribute) is allowed in ${condition}!`);
    }

    return await this.getEvaluator(operatorNames[0])(condition[operatorNames[0]], this, context);
  }
}

export const evaluateAND = async (condition: any, evaluator: ConditionEvaluator, context: any): Promise<boolean> => {
  if (!Array.isArray(condition)) {
    throw new Error(`AND condition must be an array, got ${condition}`);
  }
  try {
    for (var i = 0; i < condition.length; i++) {
      const subCondition = condition[i];
      const ret = await evaluator.evaluate(subCondition, context);

      if (!ret) {
        return false;
      }
    }

    return true;
  } catch (e) {
    throw new Error("Error when evaluating AND condition: " + e?.message);
  }
};

export const evaluateOR = async (condition: any, evaluator: ConditionEvaluator, context: any): Promise<boolean> => {
  if (!Array.isArray(condition)) {
    throw new Error(`OR condition must be an array, got ${condition}`);
  }
  try {
    for (var i = 0; i < condition.length; i++) {
      const subCondition = condition[i];
      const ret = await evaluator.evaluate(subCondition, context);

      if (ret) {
        return true;
      }
    }

    return false;
  } catch (e) {
    throw new Error("Error when evaluating AND condition: " + e?.message);
  }
};

export const evaluateRepositoryContributor = async (
  condition: any,
  evaluator: ConditionEvaluator,
  context: any
): Promise<boolean> => {
  const threshold = condition["threshold"];
  const repository = condition["repository"];

  if (!(threshold !== undefined && threshold !== null) || !repository) {
    throw new Error(`Invalid threshold or repository, got threshold='${condition}' and repository='${repository}'`);
  }
  try {
    const contributionResult = await fetchAndCheckContributionsToRepository(context, threshold, 3, repository);
    // TODO: decide what to do with errors which could accumulate in contributionResult.error
    return contributionResult.contributionValid;
  } catch (e) {
    throw new Error("Error when evaluating AND condition: " + e?.message);
  }
};

export const evaluateOrganisationContributor = async (
  condition: any,
  evaluator: ConditionEvaluator,
  context: any
): Promise<boolean> => {
  const threshold = condition["threshold"];
  const organisation = condition["organisation"];

  if (!(threshold !== undefined && threshold !== null) || !organisation) {
    throw new Error(`Invalid threshold or organisation, got threshold='${condition}' and repository='${organisation}'`);
  }
  try {
    const contributionResult = await fetchAndCheckContributionsToOrganisation(context, threshold, 3, organisation);
    // TODO: decide what to do with errors which could accumulate in contributionResult.error
    return contributionResult.contributionValid;
  } catch (e) {
    throw new Error("Error when evaluating AND condition: " + e?.message);
  }
};
