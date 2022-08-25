// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { GitPOAP, GitPOAPProvider } from "../src/providers/gitpoap";

// ----- Libs
import axios from "axios";
import { DateTime } from "luxon";
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const today = DateTime.now().toFormat("YYYY-mm-dd");

const validResponse: { data: GitPOAP[] } = {
  data: [
    {
      gitPoapId: 3261,
      name: "GitPOAP: 2022 Test Contributor",
      year: 2022,
      description: "A description",
      repositories: ["gitpoap/gitpoap-hackathon-devconnect-2022"],
      earnedAt: "2022-05-18",
      mintedAt: "2022-05-18",
    },
    {
      gitPoapId: 6781,
      name: "GitPOAP: 2022 EthereumJS Contributor",
      year: 2022,
      description: "A description",
      repositories: ["ethereumjs/ethereumjs-monorepo", "ethereumjs/ultralight"],
      earnedAt: "2022-07-13",
      mintedAt: "2022-07-13",
    },
    {
      gitPoapId: 20,
      name: "GitPOAP: 2021 Wagyu Installer Contributor",
      year: 2021,
      description: "A description",
      repositories: ["stake-house/wagyu-installer"],
      earnedAt: "2021-08-10",
      mintedAt: "2022-04-07",
    },
  ],
};

const invalidResponse: { data: GitPOAP[] } = {
  data: [
    {
      gitPoapId: 3261,
      name: "GitPOAP: 2022 Test Contributor",
      year: 2022,
      description: "A description",
      repositories: ["gitpoap/gitpoap-hackathon-devconnect-2022"],
      earnedAt: "2022-05-18",
      /* set date to today (invalid) */
      mintedAt: today,
    },
  ],
};

const emptyResponse: { data: GitPOAP[] } = {
  data: [],
};

describe("Attempt verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    mockedAxios.get.mockImplementation(async (url) => {
      if (url.includes(MOCK_ADDRESS)) {
        return validResponse;
      }
      return validResponse;
    });

    // We'll mock responses on each of the configured networks, and check the expected calls
    const gitpoap = new GitPOAPProvider();
    const verifiedPayload = await gitpoap.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        gitpoaps: validResponse.data.map((gitpoap) => gitpoap.gitPoapId).join(","),
      },
    });
  });

  it("should return invalid if the user doesn't have any GitPOAPs within the expected time range", async () => {
    mockedAxios.get.mockImplementation(async (url) => {
      if (url.includes(MOCK_ADDRESS)) {
        return invalidResponse;
      }
      return invalidResponse;
    });

    const gitpoap = new GitPOAPProvider();
    const verifiedPayload = await gitpoap.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {
        gitpoaps: undefined,
      },
    });
  });

  it("should return invalid if the user doesn't have any GitPOAPs", async () => {
    mockedAxios.get.mockImplementation(async (url) => {
      if (url.includes(MOCK_ADDRESS)) {
        return emptyResponse;
      }
      return emptyResponse;
    });

    const gitpoap = new GitPOAPProvider();
    const verifiedPayload = await gitpoap.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {
        gitpoaps: undefined,
      },
    });
  });
});
