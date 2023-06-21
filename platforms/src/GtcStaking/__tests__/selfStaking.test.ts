// TODOD - remove once tsconfig are unified across packages
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/unbound-method */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  SelfStakingBronzeProvider,
  SelfStakingSilverProvider,
  SelfStakingGoldProvider,
  stakingSubgraph,
  DataResult,
} from "../Providers/selfStaking";

// ----- Libs
import axios from "axios";

const mockedAxiosPost = jest.spyOn(axios, "post");

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();

const generateSubgraphResponse = (address: string, stake: string): Promise<DataResult> => {
  return new Promise((resolve) => {
    resolve({
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
    });
  });
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
    mockedAxiosPost.mockImplementation(async (url, data) => {
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
    expect(mockedAxiosPost).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        stakeAmount: "ssgte5",
      },
    });
  });
  it("handles invalid verification attempt where address is not proper ether address", async () => {
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
      address: "NOT_ADDRESS",
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxiosPost).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery("not_address"),
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
  it("handles invalid subgraph response", async () => {
    mockedAxiosPost.mockImplementationOnce((url, data) => {
      const query: string = (data as RequestData).query;
      if (url === stakingSubgraph && query.includes(MOCK_ADDRESS_LOWER)) {
        return new Promise((resolve) => {
          resolve(invalidselfStakingResponse);
        });
      }
    });
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxiosPost).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Self Staking Bronze Provider verifyStake Error"],
    });
  });

  it("handles invalid verification attempt where an exception is thrown", async () => {
    mockedAxiosPost.mockImplementationOnce(() => {
      throw Error("Self Staking Bronze Provider verifyStake Error");
    });
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    // Check the request to verify the subgraph query
    expect(mockedAxiosPost).toBeCalledWith(stakingSubgraph, {
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
  it("when stake amount is below 5 GTC for Bronze", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "100000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 20 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "3000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 125 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
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
  it("when stake amount above 5 GTC for Bronze", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "8000000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte5" },
    });
  });
  it("when stake amount above 20 GTC for Silver", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "60000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte20" },
    });
  });
  it("when stake amount above 125 GTC for Gold", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "500000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte125" },
    });
  });
  // All amounts equal to tier amount
  it("when stake amount equal to 5 GTC for Bronze", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "5000000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte5" },
    });
  });
  it("when stake amount equal to 20 GTC for Silver", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "20000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte20" },
    });
  });
  it("when stake amount equal to 125 GTC for Gold", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse(MOCK_ADDRESS_LOWER, "125000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte125" },
    });
  });
});
