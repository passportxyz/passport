import { ConditionEvaluator, evaluateAND, evaluateOR } from "../Providers/condition.js";
// eslint-disable-next-line  @typescript-eslint/require-await
const evaluateTrue = async (condition: any, evaluator: ConditionEvaluator, context: any): Promise<boolean> => {
  return true;
};

// eslint-disable-next-line  @typescript-eslint/require-await
const evaluateFalse = async (condition: any, evaluator: ConditionEvaluator, context: any): Promise<boolean> => {
  return false;
};

// eslint-disable-next-line  @typescript-eslint/require-await
const evaluateThrow = async (condition: any, evaluator: ConditionEvaluator, context: any): Promise<boolean> => {
  throw new Error("Error in evaluation");
};

describe("ConditionEvaluator verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid allow list verification attempt", async () => {
    const evaluator = new ConditionEvaluator({
      AND: evaluateAND,
      OR: evaluateOR,
      TRUE: evaluateTrue,
      FALSE: evaluateFalse,
      THROW: evaluateThrow,
    });

    await expect(evaluator.evaluate({ TRUE: {} }, {})).resolves.toBe(true);
    await expect(evaluator.evaluate({ FALSE: {} }, {})).resolves.toBe(false);
    await expect(evaluator.evaluate({ THROW: {} }, {})).rejects.toThrow("Error in evaluation");
  });

  it("handles deeply nested conditions", async () => {
    const evaluator = new ConditionEvaluator({
      AND: evaluateAND,
      OR: evaluateOR,
      TRUE: evaluateTrue,
      FALSE: evaluateFalse,
      THROW: evaluateThrow,
    });

    await expect(
      evaluator.evaluate(
        {
          AND: [
            { TRUE: {} },
            { OR: [{ TRUE: {} }, { FALSE: {} }] },
            { TRUE: {} },
            { AND: [{ TRUE: {} }, { TRUE: {} }, { OR: [{ TRUE: {} }, { FALSE: {} }] }] },
          ],
        },
        {}
      )
    ).resolves.toBe(true);

    await expect(
      evaluator.evaluate(
        {
          AND: [
            { TRUE: {} },
            { OR: [{ TRUE: {} }, { FALSE: {} }] },
            { TRUE: {} },
            { AND: [{ TRUE: {} }, { TRUE: {} }, { OR: [{ FALSE: {} }, { FALSE: {} }] }] },
          ],
        },
        {}
      )
    ).resolves.toBe(false);
  });
});

describe("ConditionEvaluator AND operator verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid allow list verification attempt", async () => {
    const evaluator = new ConditionEvaluator({
      AND: evaluateAND,
      OR: evaluateOR,
      TRUE: evaluateTrue,
      FALSE: evaluateFalse,
      THROW: evaluateThrow,
    });

    await expect(evaluator.evaluate({ AND: [{ TRUE: {} }] }, {})).resolves.toBe(true);
    await expect(evaluator.evaluate({ AND: [{ TRUE: {} }, { TRUE: {} }] }, {})).resolves.toBe(true);
    await expect(evaluator.evaluate({ AND: [{ TRUE: {} }, { FALSE: {} }, { TRUE: {} }] }, {})).resolves.toBe(false);
    await expect(
      evaluator.evaluate({ AND: [{ TRUE: {} }, { TRUE: {} }, { TRUE: {} }, { FALSE: {} }] }, {})
    ).resolves.toBe(false);
  });
});

describe("ConditionEvaluator OR operator verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid allow list verification attempt", async () => {
    const evaluator = new ConditionEvaluator({
      AND: evaluateAND,
      OR: evaluateOR,
      TRUE: evaluateTrue,
      FALSE: evaluateFalse,
      THROW: evaluateThrow,
    });

    await expect(evaluator.evaluate({ OR: [{ TRUE: {} }] }, {})).resolves.toBe(true);
    await expect(evaluator.evaluate({ OR: [{ FALSE: {} }] }, {})).resolves.toBe(false);
    await expect(evaluator.evaluate({ OR: [{ TRUE: {} }, { TRUE: {} }] }, {})).resolves.toBe(true);
    await expect(evaluator.evaluate({ OR: [{ TRUE: {} }, { FALSE: {} }] }, {})).resolves.toBe(true);
    await expect(evaluator.evaluate({ OR: [{ FALSE: {} }, { FALSE: {} }] }, {})).resolves.toBe(false);
    await expect(evaluator.evaluate({ OR: [{ FALSE: {} }, { FALSE: {} }, { TRUE: {} }] }, {})).resolves.toBe(true);
  });
});
