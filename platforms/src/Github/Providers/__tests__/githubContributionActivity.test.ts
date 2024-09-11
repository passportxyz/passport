import * as githubContributionActivity from "../githubContributionActivity";

import { RequestPayload, VerifiedPayload, ProviderContext } from "@gitcoin/passport-types";
import { fetchAndCheckContributions } from "../../../utils/githubClient";

const { GithubContributionActivityProvider } = githubContributionActivity;

jest.mock("../../../utils/githubClient", () => ({
  fetchAndCheckContributions: jest.fn(),
}));

describe("GithubContributionActivityProvider", function () {
  beforeEach(() => {
    jest.clearAllMocks();
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
        userId: "123",
        contributionDays: 30,
        hadBadCommits: false,
        errors: [],
      });
    });

    const provider = new GithubContributionActivityProvider({ threshold: "1" });
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(fetchAndCheckContributions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      errors: undefined,
      record: { id: "123" },
    });
  });

  it("handles error during verification", async () => {
    (fetchAndCheckContributions as jest.MockedFunction<typeof fetchAndCheckContributions>).mockImplementation(() => {
      return Promise.resolve({
        userId: "123",
        contributionDays: 30,
        hadBadCommits: false,
      });
    });

    const provider = new GithubContributionActivityProvider({ threshold: "31" });
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(fetchAndCheckContributions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      errors: ["You have contributed on 30 days, the minimum for this stamp is 31 days."],
      record: { id: "123" },
    });
  });

  it("handles invalid contributions", async () => {
    (fetchAndCheckContributions as jest.MockedFunction<typeof fetchAndCheckContributions>).mockImplementation(() => {
      return Promise.resolve({
        userId: "123",
        contributionDays: 0,
        hadBadCommits: true,
      });
    });

    const provider = new GithubContributionActivityProvider({ threshold: "1" });
    const result: VerifiedPayload = await provider.verify(mockPayload, mockContext);

    expect(fetchAndCheckContributions).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      errors: [
        "You have contributed on 0 days, the minimum for this stamp is 1 days. Some commits were ignored because they ocurred before the Github repo or user creation.",
      ],
      record: { id: "123" },
    });
  });
});
