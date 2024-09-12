import * as githubContributionActivity from "../githubContributionActivity";

import { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";
import { fetchAndCheckContributions, requestAccessToken } from "../../../utils/githubClient";

const { GithubContributionActivityProvider } = githubContributionActivity;

jest.mock("../../../utils/githubClient", () => ({
  fetchAndCheckContributions: jest.fn(),
  requestAccessToken: jest.fn(),
}));

describe("GithubContributionActivityProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    (requestAccessToken as jest.MockedFunction<typeof requestAccessToken>).mockImplementation(() => {
      return Promise.resolve("access-token");
    });
  });
  const mockContext: ProviderContext = {
    github: {
      id: "123",
    },
  };
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
        errors: [],
      });
    });

    const provider = new GithubContributionActivityProvider({ threshold: "1" });
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(fetchAndCheckContributions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      errors: [],
      record: { id: "123" },
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
      errors: ["Your Github contributions did not qualify for this stamp."],
      record: undefined,
    });
  });

  it("handles invalid contributions", async () => {
    (fetchAndCheckContributions as jest.MockedFunction<typeof fetchAndCheckContributions>).mockImplementation(() => {
      return Promise.resolve({
        contributionValid: false,
        errors: ["Your Github contributions did not qualify for this stamp."],
      });
    });

    const provider = new GithubContributionActivityProvider({ threshold: "1" });
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(fetchAndCheckContributions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      errors: ["Your Github contributions did not qualify for this stamp."],
      record: undefined,
    });
  });
});
