// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  SelfStakingBronzeProvider,
  SelfStakingSilverProvider,
  SelfStakingGoldProvider,
} from "../Providers/selfStaking";

import { stakingSubgraph, StakeResponse, getStakeQuery } from "../Providers/GtcStaking";

const getSubgraphQuery = (address: string) => getStakeQuery(address, "1");

// ----- Libs
import axios from "axios";

const mockedAxiosPost = jest.spyOn(axios, "post");

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();

const generateSubgraphResponse = (stake: string): Promise<StakeResponse> => {
  return new Promise((resolve) => {
    resolve({
      data: {
        data: {
          users: [
            {
              stakes: [
                {
                  stake,
                },
              ],
              xstakeAggregates: [],
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

interface RequestData {
  query: string;
}

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async (url, data) => {
      const query: string = (data as RequestData).query;
      if (url === stakingSubgraph && query.includes(MOCK_ADDRESS_LOWER)) {
        return generateSubgraphResponse("220000000000000000000");
      }
    });
  });

  it("handles valid verification attempt", async () => {
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

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
    const verifiedPayload = await selfStakingProvider.verify(
      {
        address: "NOT_ADDRESS",
      } as unknown as RequestPayload,
      {}
    );

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
    const verifiedPayload = await selfStakingProvider.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    // Check the request to verify the subgraph query
    expect(mockedAxiosPost).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["SelfStakingBronze verifyStake Error"],
    });
  });

  it("handles invalid verification attempt where an exception is thrown", async () => {
    mockedAxiosPost.mockImplementationOnce(() => {
      throw Error("SelfStakingBronze verifyStake Error");
    });
    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    // Check the request to verify the subgraph query
    expect(mockedAxiosPost).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["SelfStakingBronze verifyStake Error"],
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
      return generateSubgraphResponse("100000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 20 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("3000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 125 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("8000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({ valid: false });
  });
});

// All the positive cases for thresholds are tested
describe("should return valid payload", function () {
  it("when stake amount above 5 GTC for Bronze", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("8000000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte5" },
    });
  });
  it("when stake amount above 20 GTC for Silver", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("60000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte20" },
    });
  });
  it("when stake amount above 125 GTC for Gold", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("500000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte125" },
    });
  });
  // All amounts equal to tier amount
  it("when stake amount equal to 5 GTC for Bronze", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("5000000000000000000");
    });

    const selfstaking = new SelfStakingBronzeProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte5" },
    });
  });
  it("when stake amount equal to 20 GTC for Silver", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("20000000000000000000");
    });

    const selfstaking = new SelfStakingSilverProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte20" },
    });
  });
  it("when stake amount equal to 125 GTC for Gold", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("125000000000000000000");
    });

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "ssgte125" },
    });
  });
});
