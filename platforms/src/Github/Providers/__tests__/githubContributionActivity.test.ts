import * as githubContributionActivity from "../githubContributionActivity";

import { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";
import { fetchAndCheckContributions } from "../githubClient";

const { GithubContributionActivityProvider } = githubContributionActivity;

jest.mock("../githubClient", () => ({
  fetchAndCheckContributions: jest.fn(),
}));

describe("GithubContributionActivityProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const mockContext: ProviderContext = {}; // define the mock context if needed
  const mockPayload: RequestPayload = {
    address: "0x0",
    proofs: {
      code: "ABC123_ACCESSCODE",
    },
    type: "",
    version: "",
  };

  it("handles valid verification attempt", async () => {
    (fetchAndCheckContributions as jest.MockedFunction<typeof fetchAndCheckContributions>).mockImplementation(() => {
      return Promise.resolve({
        contributionValid: true,
        errors: undefined,
      });
    });

    const provider = new GithubContributionActivityProvider({ threshold: "1" });
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(fetchAndCheckContributions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      error: undefined,
      record: { id: "gte1GithubContributionActivity" },
    });
  });

  it("handles error during verification", async () => {
    (fetchAndCheckContributions as jest.MockedFunction<typeof fetchAndCheckContributions>).mockImplementation(() => {
      return Promise.resolve({
        contributionValid: false,
        errors: ["Some error"],
      });
    });

    const provider = new GithubContributionActivityProvider({ threshold: "1" });
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(fetchAndCheckContributions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: ["Some error"],
      record: undefined,
    });
  });

  it("handles invalid contributions", async () => {
    (fetchAndCheckContributions as jest.MockedFunction<typeof fetchAndCheckContributions>).mockImplementation(() => {
      return Promise.resolve({
        contributionValid: false,
        errors: undefined,
      });
    });

    const provider = new GithubContributionActivityProvider({ threshold: "1" });
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(fetchAndCheckContributions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: undefined,
      record: undefined,
    });
  });
});
