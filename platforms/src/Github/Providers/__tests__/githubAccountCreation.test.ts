import * as githubAccountCreation from "../githubAccountCreation";
import { RequestPayload, ProviderContext } from "@gitcoin/passport-types";
import { fetchGithubUserData } from "../githubClient";

const { GithubAccountCreationProvider } = githubAccountCreation;

jest.mock("../githubClient", () => ({
  fetchGithubUserData: jest.fn(),
}));

describe("GithubAccountCreationProvider", function () {
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

  it("handles valid account age", async () => {
    (fetchGithubUserData as jest.MockedFunction<typeof fetchGithubUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: "2020-01-01T00:00:00Z",
        errors: undefined,
      });
    });

    const provider = new GithubAccountCreationProvider({ threshold: "365" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(fetchGithubUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: true,
      error: undefined,
      record: { id: "gte365GithubContributionActivity" },
    });
  });

  it("handles account age below threshold", async () => {
    (fetchGithubUserData as jest.MockedFunction<typeof fetchGithubUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: new Date().toISOString(), // Account created today
        errors: undefined,
      });
    });

    const provider = new GithubAccountCreationProvider({ threshold: "365" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(fetchGithubUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: undefined,
      record: undefined,
    });
  });

  it("handles error during verification", async () => {
    (fetchGithubUserData as jest.MockedFunction<typeof fetchGithubUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: undefined,
        errors: ["Some error"],
      });
    });

    const provider = new GithubAccountCreationProvider({ threshold: "365" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(fetchGithubUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      error: ["Some error"],
      record: undefined,
    });
  });
});
