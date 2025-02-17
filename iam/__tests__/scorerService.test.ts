import { jest, it, describe, expect, beforeEach } from "@jest/globals";
import { fetchPassportScore } from "../src/utils/scorerService.js";

jest.mock("../src/utils/scorerService");

const mockedFetchPassportScore = fetchPassportScore as jest.Mock<typeof fetchPassportScore>;

describe("score utilities", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should return custom scorer id if provided", async () => {
    // Set up the mock implementation for this specific test
    mockedFetchPassportScore.mockResolvedValue({ score: 10, scorer_id: 1 });

    const score = await fetchPassportScore("recipient", 1);
    expect(score).toEqual({ score: 10, scorer_id: 1 });
    expect(mockedFetchPassportScore).toHaveBeenCalledWith("recipient", 1);
  });
});
