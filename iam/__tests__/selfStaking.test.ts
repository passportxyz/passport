// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  SelfStakingBronzeProvider,
  SelfStakingSilverProvider,
  SelfStakingGoldProvider,
  stakingSubgraph,
  DataResult,
} from "../src/providers/selfStaking";

// ----- Libs
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();

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

const invalidselfStakingResponse = {
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
        stakes(where: {round: "1"}) {
          stake
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
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
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
        stakeAmount: "ssgte1",
      },
    });
  });
  it("handles invalid verification attempt where address is not proper ether address", async () => {
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
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
        return invalidselfStakingResponse;
      }
    });
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Self Staking Bronze Provider verifyStake Error"],
    });
  });

  it("handles invalid verification attempt where an exception is thrown", async () => {
    mockedAxios.post.mockImplementationOnce(async (url, data) => {
      throw Error("Self Staking Bronze Provider verifyStake Error");
    });
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxios.post).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Self Staking Bronze Provider verifyStake Error"],
    });
  });
});

// All the negative cases for thresholds are tested
describe("should return invalid payload", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("when stake amount is below 1 GTC for Bronze", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "100000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 10 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "3000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 100 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "8000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
});

// All the positive cases for thresholds are tested
describe("should return valid payload", function () {
  it("when stake amount above 1 GTC for Bronze", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "5000000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte1" },
    });
  });
  it("when stake amount above 10 GTC for Silver", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "60000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte10" },
    });
  });
  it("when stake amount above 100 GTC for Gold", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "500000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte100" },
    });
  });
  // All amounts equal to tier amount
  it("when stake amount equal to 1 GTC for Bronze", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "1000000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte1" },
    });
  });
  it("when stake amount equal to 10 GTC for Silver", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "10000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte10" },
    });
  });
  it("when stake amount equal to 100 GTC for Gold", async () => {
    mockedAxios.post.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "100000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte100" },
    });
  });
});
