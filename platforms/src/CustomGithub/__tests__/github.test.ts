// Import the necessary modules and mock axios
import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";
import axios from "axios";
import { CustomGithubProvider } from "../Providers/github"; // Adjust the import path as necessary
import * as githubClient from "../../utils/githubClient";

jest.mock("axios");

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";

const payload = {
  address: MOCK_ADDRESS,
  proofs: {
    conditionName: "test",
  },
} as unknown as RequestPayload;
const mockedGithubId = "238452";

const mockGithubContext: githubClient.GithubContext = {
  github: {
    accessToken: "abc",
  },
};

describe("CustomGithubProvider verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    // Mocking axios response for a valid case
    const axiosMock = (axios.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("account/custom-github-stamps/condition")) {
        return Promise.resolve({
          data: {
            condition: {
              repository_contributor: {
                repository: "passportxyz/passport",
                threshold: 3,
              },
            },
          },
        });
      }
    });

    jest.spyOn(githubClient, "requestAccessToken").mockImplementationOnce(() => {
      return Promise.resolve("access-token");
    });
    jest.spyOn(githubClient, "getGithubUserData").mockImplementationOnce(() => {
      return Promise.resolve(mockedGithubId);
    });
    jest.spyOn(githubClient, "fetchAndCheckContributionsToRepository").mockImplementationOnce(() => {
      return Promise.resolve({
        contributionValid: true,
        numberOfDays: 3,
      });
    });

    const customGithubProvider = new CustomGithubProvider();
    const verification = await customGithubProvider.verify(payload, mockGithubContext);

    expect(verification).toEqual({
      valid: true,
      record: {
        id: mockedGithubId,
        conditionName: "test",
      },
      errors: [],
    });
  });

  it("handles errors during verification", async () => {
    // Simulating an axios error
    (axios.get as jest.Mock).mockRejectedValue("Network error");

    const customGithubProvider = new CustomGithubProvider();
    await expect(customGithubProvider.verify(payload, {})).rejects.toThrow(ProviderExternalVerificationError);
  });
});
