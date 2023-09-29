/* eslint-disable */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { SnapshotProposalsProvider, snapshotGraphQLDatabase } from "../snapshotProposalsProvider";

// ----- Libs
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();
const NO_MOCK_ADDRESS = "";
const BAD_MOCK_ADDRESS = "F314CE817E25b4F784bC1f24c9A79A525fEC50f";
const BAD_MOCK_ADDRESS_LOWER = BAD_MOCK_ADDRESS.toLocaleLowerCase();

const validSnapshotResponse = {
  data: {
    data: {
      proposals: [
        {
          id: "0x8f46d1bd6d14681d42fa01b80f14b56f2953f5a8b95154d6ce9c8fe1db599771",
          scores_total: 0,
          author: `${MOCK_ADDRESS_LOWER}`,
        },
        {
          id: "0x4d33fc4d9f6b8a6ed44ef78a1cc3dcb6c120c7f28fa938ced99385bbdaa0ba23",
          scores_total: 228,
          author: `${MOCK_ADDRESS_LOWER}`,
        },
      ],
    },
  },
};

const invalidSnapshotResponseNoProposalVotes = {
  data: {
    data: {
      proposals: [
        {
          id: "0x8f46d1bd6d14681d42fa01b80f14b56f2953f5a8b95154d6ce9c8fe1db599771",
          scores_total: 0,
          author: `${MOCK_ADDRESS_LOWER}`,
        },
        {
          id: "0x4d33fc4d9f6b8a6ed44ef78a1cc3dcb6c120c7f28fa938ced99385bbdaa0ba23",
          scores_total: 0,
          author: `${MOCK_ADDRESS_LOWER}`,
        },
      ],
    },
  },
};

const invalidSnapshotResponseNoProposals = {
  data: {
    data: {
      proposals: null as unknown as [],
    },
  },
};

interface RequestData {
  query: string;
}

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === snapshotGraphQLDatabase && query.includes(MOCK_ADDRESS_LOWER)) {
        return validSnapshotResponse;
      }
    });

    const snapshotProposalsProvider = new SnapshotProposalsProvider();
    const verifiedPayload = await snapshotProposalsProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        address: `${MOCK_ADDRESS_LOWER}`,
        hasGT1SnapshotProposalsVotedOn: "true",
      },
    });
  });

  it("should return invalid payload if the user has proposals, but none of them have been voted on", async () => {
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === snapshotGraphQLDatabase && query.includes(MOCK_ADDRESS_LOWER)) {
        return invalidSnapshotResponseNoProposalVotes;
      }
    });

    const snapshotProposalsProvider = new SnapshotProposalsProvider();
    const verifiedPayload = await snapshotProposalsProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload if the user does not have any proposals (empty proposals array)", async () => {
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === snapshotGraphQLDatabase && query.includes(MOCK_ADDRESS_LOWER)) {
        return invalidSnapshotResponseNoProposals;
      }
    });

    const snapshotProposalsProvider = new SnapshotProposalsProvider();
    const verifiedPayload = await snapshotProposalsProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload when there is no address to send with the graphQL query", async () => {
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === snapshotGraphQLDatabase && query.includes(NO_MOCK_ADDRESS)) {
        return Promise.resolve({
          status: 400,
          error: {
            response: {
              message: "Syntax Error: Invalid number, expected digit but got: 'x'.",
            },
          },
        });
      }
    });

    const snapshotProposalsProvider = new SnapshotProposalsProvider();

    await expect(async () => {
      return await snapshotProposalsProvider.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);
    }).rejects.toThrowError("Error verifying Snapshot proposals: {}.");
  });

  it("should return invalid payload when a bad status code is returned after Snapshot graphQL query", async () => {
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === snapshotGraphQLDatabase && query.includes(BAD_MOCK_ADDRESS_LOWER)) {
        return Promise.resolve({
          status: 400,
          error: {
            response: {
              message: "Bad request",
            },
          },
        });
      }
    });

    const snapshotProposalsProvider = new SnapshotProposalsProvider();

    await expect(async () => {
      return await snapshotProposalsProvider.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);
    }).rejects.toThrowError("Error verifying Snapshot proposals: {}.");
  });

  it("should return invalid payload when an exception is thrown when a request is made", async () => {
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === snapshotGraphQLDatabase && query.includes(BAD_MOCK_ADDRESS_LOWER)) {
        throw "an error";
      }
    });

    const snapshotProposalsProvider = new SnapshotProposalsProvider();

    await expect(async () => {
      return await snapshotProposalsProvider.verify({
        address: MOCK_ADDRESS,
      } as RequestPayload);
    }).rejects.toThrowError('Error verifying Snapshot proposals: "an error".');
  });
});
