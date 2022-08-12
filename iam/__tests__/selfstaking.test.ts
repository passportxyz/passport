// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  SelfStakingBronzeProvider,
  SelfStakingSilverProvider,
  SelfStakingGoldProvider,
  stakingSubgraph,
  DataResult,
} from "../src/providers/selfstaking";

// ----- Libs
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();

const validselfStakingResponse: DataResult = {
  data: {
    data: {
      address: MOCK_ADDRESS_LOWER,
      users: [
        {
          stakes: [
            {
              stake: "220000000000000000000",
              round: {
                id: "2",
              },
            },
          ],
        },
      ],
    },
  },
};

const invalidselfStakingResponse = {
  data: {
    data: {
      users: [{}],
    },
  },
};

const generateSubgraphResponse = (address: string, stake: string): DataResult => {
  return {
    data: {
      data: {
        address: address,
        users: [
          {
            stakes: [
              {
                stake: stake,
                round: {
                  id: "2",
                },
              },
            ],
          },
        ],
      },
    },
  };
};

// const AxiosPost = jest.spyOn(axios.prototype, "post");

interface RequestData {
  query: string;
}

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === stakingSubgraph && query.includes(MOCK_ADDRESS_LOWER)) {
        return validselfStakingResponse;
      }
    });
  });

  it("handles valid verification attempt", async () => {
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: `
    {
      users(where: {address: "${MOCK_ADDRESS_LOWER}"}) {
        address,
        stakes(where: {round: "2", total_gt: 0}) {
          stake
          round {
            id
          }
        }
      }
    }
      `,
    });

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        stakeAmount: "csgt1",
      },
    });
  });
  it("handles invalid verification attempt where address is not proper ether address", async () => {
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
      address: "NOT_ADDRESS",
    } as unknown as RequestPayload);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: `
    {
      users(where: {address: "not_address"}) {
        address,
        stakes(where: {round: "2", total_gt: 0}) {
          stake
          round {
            id
          }
        }
      }
    }
      `,
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
  it("handles invalid subgraph response", async () => {
    mockedAxios.post.mockImplementationOnce(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === stakingSubgraph && query.includes(MOCK_ADDRESS_LOWER)) {
        return invalidselfStakingResponse;
      }
    });
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to get the token
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: `
    {
      users(where: {address: "${MOCK_ADDRESS_LOWER}"}) {
        address,
        stakes(where: {round: "2", total_gt: 0}) {
          stake
          round {
            id
          }
        }
      }
    }
      `,
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["{}"],
    });
  });
});
describe("should return invalid payload", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("when stake amount is below 1 GTC for Bronze", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "0");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 5 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "1000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 50 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "10000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
});

describe("should return valid payload", function () {
  it("when stake amount above 1 GTC for Bronze", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "5000000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: true });
  });
  it("when stake amount above 5 GTC for Silver", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "6000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: true });
  });
  it("when stake amount above 50 GTC for Gold", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "520000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: true });
  });
});
