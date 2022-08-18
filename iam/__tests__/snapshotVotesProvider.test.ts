// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { SnapshotVotesProvider } from "../src/providers/snapshotVotesProvider";
import { snapshotGraphQLDatabase } from "../src/providers/snapshotProposalsProvider";

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
      votes: [
        {
          voter: "0xc2E2B715d9e302947Ec7e312fd2384b5a1296099",
          proposal: {
            id: "0xc6655f1fb08259263693f9111a8cdaba6b726390e9dbb65eaa6ce41905ba297c"
          },
          space: {
            id: "gitcoindao.eth",
          },
        },
        {
          voter: "0xc2E2B715d9e302947Ec7e312fd2384b5a1296099",
          proposal: {
            id: "0xc6309348f43ba77bb488d2d5f154db3264f86a890b500fa8286fe089c6ddc9a0"
          },
          space: {
            id: "gitcoindao.eth",
          },
        },
        {
          voter: "0xc2E2B715d9e302947Ec7e312fd2384b5a1296099",
          proposal: {
            id: "0x625e70dcff35be042778684d66cb3e24efd35bdc4222d263047afd2699188fb6"
          },
          space: {
            id: "opcollective.eth",
          },
        },
        {
          voter: "0xc2E2B715d9e302947Ec7e312fd2384b5a1296099",
          proposal: {
            id: "0x3fcd17d2393cfdcd3583a97fea85dfc9bc874b2e8ac2427c059e4e2566197e7f"
          },
          space: {
            id: "rehashweb3.eth",
          },
        },
      ],
    },
  },
};

const invalidSnapshotResponseLessThan2DAOProposalVotes = {
  data: {
    data: {
      votes: [
        {
          voter: "0xc2E2B715d9e302947Ec7e312fd2384b5a1296099",
          proposal: {
            id: "0xc6655f1fb08259263693f9111a8cdaba6b726390e9dbb65eaa6ce41905ba297c"
          },
          space: {
            id: "gitcoindao.eth",
          }
        },
      ],
    },
  },
};

const invalidSnapshotResponseNoProposalsVotedOn = {
  data: {
    data: {
      votes: null as [],
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

    const snapshotVotesProvider = new SnapshotVotesProvider();
    const verifiedPayload = await snapshotVotesProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: `${MOCK_ADDRESS_LOWER}`,
        hasVotedOnGTE2SnapshotProposals: "true",
      }
    });
  });

  it("should return invalid payload if the user has voted on less than 2 DAO proposals", async () => {
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === snapshotGraphQLDatabase && query.includes(MOCK_ADDRESS_LOWER)) {
        return invalidSnapshotResponseLessThan2DAOProposalVotes;
      }
    });

    const snapshotVotesProvider = new SnapshotVotesProvider();
    const verifiedPayload = await snapshotVotesProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toMatchObject({ valid: false });
  });

  it("should return invalid payload if the user has not voted on any DAO proposals (empty proposals array)", async () => {
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === snapshotGraphQLDatabase && query.includes(MOCK_ADDRESS_LOWER)) {
        return invalidSnapshotResponseNoProposalsVotedOn;
      }
    });

    const snapshotVotesProvider = new SnapshotVotesProvider();
    const verifiedPayload = await snapshotVotesProvider.verify({
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

    const snapshotVotesProvider = new SnapshotVotesProvider();
    const verifiedPayload = await snapshotVotesProvider.verify({
      address: NO_MOCK_ADDRESS,
    } as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toMatchObject({ valid: false });
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

    const snapshotVotesProvider = new SnapshotVotesProvider();
    const verifiedPayload = await snapshotVotesProvider.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(verifiedPayload).toMatchObject({ valid: false });
  });
});