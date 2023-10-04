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
      record: { id: "123" },
    });
  });

  it("handles account age below threshold", async () => {
    const isoDate = new Date().toISOString();
    (fetchGithubUserData as jest.MockedFunction<typeof fetchGithubUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: new Date().toISOString(), // Account created today
        errors: [`Github account age, 0, is less than the required 365 days (created at ${isoDate})`],
      });
    });

    const provider = new GithubAccountCreationProvider({ threshold: "365" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(fetchGithubUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      errors: [expect.stringMatching("Github account age, 0, is less than the required 365 days")],
      record: undefined,
    });
  });

  it("handles error during verification", async () => {
    (fetchGithubUserData as jest.MockedFunction<typeof fetchGithubUserData>).mockImplementation(() => {
      return Promise.resolve({
        createdAt: undefined,
        errors: ["createdAt is undefined"],
      });
    });

    const provider = new GithubAccountCreationProvider({ threshold: "365" });
    const result = await provider.verify(mockPayload, mockContext);

    expect(fetchGithubUserData).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      valid: false,
      errors: ["createdAt is undefined"],
      record: undefined,
    });
  });
});
