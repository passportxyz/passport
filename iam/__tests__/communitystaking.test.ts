// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  CommunityStakingBronzeProvider,
  CommunityStakingSilverProvider,
  CommunityStakingGoldProvider,
  stakingSubgraph,
  DataResult,
} from "../src/providers/communitystaking";

// ----- Libs
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();

const generateSubgraphResponse = (address: string, total: string): DataResult => {
  return {
    data: {
      data: {
        address: address,
        users: [
          {
            xstakeAggregates: [
              {
                total: total,
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

const invalidCommunityStakingResponse = {
  data: {
    data: {
      users: [{}],
    },
  },
};

interface RequestData {
  query: string;
}

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === stakingSubgraph && query.includes(MOCK_ADDRESS_LOWER)) {
        return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "220000000000000000000");
      }
    });
  });

  it("handles valid verification attempt", async () => {
    const communityStakingProvider = new CommunityStakingBronzeProvider();
    const verifiedPayload = await communityStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: `
    {
      users(where: {address: "${MOCK_ADDRESS_LOWER}"}) {
        address,
        xstakeAggregates(where: {round: "2", total_gt: 0}) {
          total
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
        stakeAmount: "csgt10",
      },
    });
  });
  it("handles invalid verification attempt where address is not proper ether address", async () => {
    const communityStakingProvider = new CommunityStakingBronzeProvider();
    const verifiedPayload = await communityStakingProvider.verify({
      address: "NOT_ADDRESS",
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: `
    {
      users(where: {address: "not_address"}) {
        address,
        xstakeAggregates(where: {round: "2", total_gt: 0}) {
          total
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
        return invalidCommunityStakingResponse;
      }
    });
    const communityStakingProvider = new CommunityStakingBronzeProvider();
    const verifiedPayload = await communityStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: `
    {
      users(where: {address: "${MOCK_ADDRESS_LOWER}"}) {
        address,
        xstakeAggregates(where: {round: "2", total_gt: 0}) {
          total
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

// All the negative case for thresholds are tested
describe("should return invalid payload", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("when stake amount is below 10 GTC for Bronze", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "500000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 100 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "9000000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 500 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "40000000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({ valid: false });
  });
});

// All the positive cases for thresholds are tested
describe("should return valid payload", function () {
  it("when stake amount above 10 GTC for Bronze", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "12000000000000000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({ valid: true });
  });
  it("when stake amount above 100 GTC for Silver", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "120000000000000000000");
    });

    const communitystaking = new CommunityStakingSilverProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({ valid: true });
  });
  it("when stake amount above 500 GTC for Gold", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "5200000000000000000000");
    });

    const communitystaking = new CommunityStakingGoldProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({ valid: true });
  });
});
