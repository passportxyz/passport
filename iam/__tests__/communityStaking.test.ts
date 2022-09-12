// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  CommunityStakingBronzeProvider,
  CommunityStakingSilverProvider,
  CommunityStakingGoldProvider,
  stakingSubgraph,
  DataResult,
} from "../src/providers/communityStaking";

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
                  id: "1",
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

const getSubgraphQuery = (address: string): string => {
  return `
    {
      users(where: {address: "${address}"}) {
        address,
        xstakeAggregates(where: {round: "1", total_gt: 0}) {
          total
          round {
            id
          }
        }
      }
    }
      `;
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
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        stakeAmount: "csgte1",
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
      query: getSubgraphQuery("not_address"),
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
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Community Staking Bronze Provider verifyStake Error"],
    });
  });
  it("handles invalid verification attempt where an exception is thrown", async () => {
    mockedAxios.post.mockImplementationOnce(async (url, data) => {
      throw Error("Community Staking Bronze Provider verifyStake Error");
    });
    const communityStakingProvider = new CommunityStakingBronzeProvider();
    const verifiedPayload = await communityStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Community Staking Bronze Provider verifyStake Error"],
    });
  });
});

// All the negative case for thresholds are tested
describe("should return invalid payload", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("when stake amount is below 1 GTC for Bronze", async () => {
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
  it("when stake amount is below 10 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "5000000000000000000");
    });

    const communitystaking = new CommunityStakingSilverProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 100 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "40000000000000000000");
    });

    const communitystaking = new CommunityStakingGoldProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({ valid: false });
  });
});

// All the positive cases for thresholds are tested
describe("should return valid payload", function () {
  it("when stake amount above 1 GTC for Bronze", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "2000000000000000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte1" },
    });
  });
  it("when stake amount above 10 GTC for Silver", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "15000000000000000000");
    });

    const communitystaking = new CommunityStakingSilverProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte10" },
    });
  });
  it("when stake amount above 100 GTC for Gold", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "500000000000000000000");
    });

    const communitystaking = new CommunityStakingGoldProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte100" },
    });
  });
  // All values equal to tier amount
  it("when stake amount is equal to 1 GTC for Bronze", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "1000000000000000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte1" },
    });
  });
  it("when stake amount is equal to 10 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "10000000000000000000");
    });

    const communitystaking = new CommunityStakingSilverProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte10" },
    });
  });
  it("when stake amount is equal to 100 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "100000000000000000000");
    });

    const communitystaking = new CommunityStakingGoldProvider();

    const communitystakingPayload = await communitystaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte100" },
    });
  });
});
