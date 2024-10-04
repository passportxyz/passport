import {
  fetchAndCheckCommitCountToRepository,
  fetchAndCheckContributionsToOrganisation,
  fetchAndCheckContributionsToRepository,
  GithubContext,
} from "../../utils/githubClient";

type OperatorHandler = (condition: any, evaluator: ConditionEvaluator, context: any) => Promise<boolean>;

const isObject = (variable: any): boolean => {
  return typeof variable === "object" && !Array.isArray(variable) && variable !== null;
};

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
    if (!isObject(condition)) {
      throw new Error(`condition expected to be an object, got ${JSON.stringify(condition)}`);
    }

    const operatorNames = Object.keys(condition);
    if (operatorNames.length !== 1) {
      throw new Error(`Only 1 operator (attribute) is allowed in ${JSON.stringify(condition)}!`);
    }

    return await this.getEvaluator(operatorNames[0])(condition[operatorNames[0]], this, context);
  }
}

export const evaluateAND = async (condition: any, evaluator: ConditionEvaluator, context: any): Promise<boolean> => {
  if (!Array.isArray(condition)) {
    throw new Error(`AND condition must be an array, got ${JSON.stringify(condition)}`);
  }
  try {
    for (let i = 0; i < condition.length; i++) {
      const subCondition = condition[i];
      const ret = await evaluator.evaluate(subCondition as Record<string, object>, context);

      if (!ret) {
        return false;
      }
    }

    return true;
  } catch (_e: unknown) {
    const e = _e as Error;
    throw new Error(`Error when evaluating AND condition ${JSON.stringify(condition)}: ` + e?.message);
  }
};

export const evaluateOR = async (condition: any, evaluator: ConditionEvaluator, context: any): Promise<boolean> => {
  if (!Array.isArray(condition)) {
    throw new Error(`OR condition must be an array, got ${condition}`);
  }
  try {
    for (let i = 0; i < condition.length; i++) {
      const subCondition = condition[i];
      const ret = await evaluator.evaluate(subCondition as Record<string, object>, context);

      if (ret) {
        return true;
      }
    }

    return false;
  } catch (_e: unknown) {
    const e = _e as Error;
    throw new Error(`Error when evaluating OR condition ${JSON.stringify(condition)}: ` + e?.message);
  }
};

export const evaluateRepositoryContributor = async (
  condition: { threshold: number; repository: string },
  evaluator: ConditionEvaluator,
  context: any
): Promise<boolean> => {
  const threshold = condition["threshold"];
  const repository = condition["repository"];

  if (!(threshold !== undefined && threshold !== null) || !repository) {
    throw new Error(`Invalid threshold or repository, got threshold='${threshold}' and repository='${repository}'`);
  }
  try {
    const contributionResult = await fetchAndCheckContributionsToRepository(
      context as GithubContext,
      threshold,
      3,
      repository
    );
    return contributionResult.contributionValid;
  } catch (_e: unknown) {
    const e = _e as Error;
    throw new Error("Error when evaluating RepositoryContributor condition: " + e?.message);
  }
};

export const evaluateOrganisationContributor = async (
  condition: { threshold: number; organisation: string },
  evaluator: ConditionEvaluator,
  context: any
): Promise<boolean> => {
  const threshold = condition["threshold"];
  const organisation = condition["organisation"];

  if (!(threshold !== undefined && threshold !== null) || !organisation) {
    throw new Error(`Invalid threshold or organisation, got threshold='${threshold}' and repository='${organisation}'`);
  }
  try {
    const contributionResult = await fetchAndCheckContributionsToOrganisation(
      context as GithubContext,
      `${threshold}`,
      3,
      organisation
    );
    return contributionResult.contributionDays >= threshold;
  } catch (_e: unknown) {
    const e = _e as Error;
    throw new Error("Error when evaluating OrganisationContributor condition: " + e?.message);
  }
};

/// Evaluate the number of commits to a repository by a user
/// cutoff_date is an optional parameter. If specified, it needs to be an string in ISO format, for example: "2011-10-05T14:48:00.000Z"
export const evaluateRepositoryCommiter = async (
  condition: { threshold: number; repository: string; cutoff_date?: string },
  evaluator: ConditionEvaluator,
  context: any
): Promise<boolean> => {
  const threshold = condition["threshold"];
  const repository = condition["repository"];
  const cutOffDate = condition["cutoff_date"] ? new Date(condition["cutoff_date"]) : undefined;

  if (!(threshold !== undefined && threshold !== null) || !repository) {
    throw new Error(`Invalid threshold or repository, got threshold='${threshold}' and repository='${repository}'`);
  }
  try {
    const contributionResult = await fetchAndCheckCommitCountToRepository(
      context as GithubContext,
      threshold,
      3,
      repository,
      cutOffDate
    );
    return contributionResult.contributionValid;
  } catch (_e: unknown) {
    const e = _e as Error;
    throw new Error("Error when evaluating RepositoryContributor condition: " + e?.message);
  }
};
