// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  CommunityStakingBronzeProvider,
  CommunityStakingSilverProvider,
  CommunityStakingGoldProvider,
} from "../Providers/communityStaking";

import { stakingSubgraph, StakeResponse, getStakeQuery } from "../Providers/GtcStaking";

const getSubgraphQuery = (address: string) => getStakeQuery(address, "1");

// ----- Libs
import axios from "axios";

const mockedAxiosPost = jest.spyOn(axios, "post");

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();

const generateSubgraphResponse = (total: string): Promise<StakeResponse> => {
  return new Promise((resolve) => {
    resolve({
      data: {
        data: {
          users: [
            {
              stakes: [],
              xstakeAggregates: [
                {
                  total,
                },
              ],
            },
          ],
        },
      },
    });
  });
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
    mockedAxiosPost.mockImplementation((url, data) => {
      const query: string = (data as RequestData).query;
      if (url === stakingSubgraph && query.includes(MOCK_ADDRESS_LOWER)) {
        return generateSubgraphResponse("220000000000000000000");
      }
    });
  });

  it("handles valid verification attempt", async () => {
    const communityStakingProvider = new CommunityStakingBronzeProvider();
    const verifiedPayload = await communityStakingProvider.verify(
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
        stakeAmount: "csgte5",
      },
      errors: [],
    });
  });
  it("handles invalid verification attempt where address is not proper ether address", async () => {
    const communityStakingProvider = new CommunityStakingBronzeProvider();
    // Check the request to verify the subgraph query
    await expect(async () => {
      return await communityStakingProvider.verify(
        {
          address: "not_address",
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow("CommunityStakingBronze verifyStake: Error: Not a proper address.");
  });

  it("handles invalid subgraph response", async () => {
    mockedAxiosPost.mockImplementationOnce((url, data) => {
      const query: string = (data as RequestData).query;
      if (url === stakingSubgraph && query.includes(MOCK_ADDRESS_LOWER)) {
        return new Promise((resolve) => {
          resolve(invalidCommunityStakingResponse);
        });
      }
    });
    const communityStakingProvider = new CommunityStakingBronzeProvider();
    await expect(async () => {
      return await communityStakingProvider.verify(
        {
          address: MOCK_ADDRESS_LOWER,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow("CommunityStakingBronze verifyStake: TypeError: Cannot read properties of undefined");
    // Check the request to verify the subgraph query
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockedAxiosPost).toBeCalledWith(stakingSubgraph, {
      query: getSubgraphQuery(MOCK_ADDRESS_LOWER),
    });
  });
  it("handles invalid verification attempt where an exception is thrown", async () => {
    mockedAxiosPost.mockImplementationOnce(() => {
      throw Error();
    });
    const communityStakingProvider = new CommunityStakingBronzeProvider();

    // Check the request to verify the subgraph query
    // eslint-disable-next-line @typescript-eslint/unbound-method
    await expect(async () => {
      return await communityStakingProvider.verify(
        {
          address: MOCK_ADDRESS_LOWER,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow("CommunityStakingBronze verifyStake: Error.");
  });
});

// All the negative case for thresholds are tested
describe("should return invalid payload", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("when stake amount is below 5 GTC for Bronze", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("500000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 20 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("5000000000000000000");
    });

    const communitystaking = new CommunityStakingSilverProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({ valid: false });
  });
  it("when stake amount is below 125 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("40000000000000000000");
    });

    const communitystaking = new CommunityStakingGoldProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({ valid: false });
  });
});

// All the positive cases for thresholds are tested
describe("should return valid payload", function () {
  it("when stake amount above 5 GTC for Bronze", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("6000000000000000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte5" },
    });
  });
  it("when stake amount above 20 GTC for Silver", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("25000000000000000000");
    });

    const communitystaking = new CommunityStakingSilverProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte20" },
    });
  });
  it("when stake amount above 125 GTC for Gold", async () => {
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("500000000000000000000");
    });

    const communitystaking = new CommunityStakingGoldProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte125" },
    });
  });
  // All values equal to tier amount
  it("when stake amount is equal to 5 GTC for Bronze", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("5000000000000000000");
    });

    const communitystaking = new CommunityStakingBronzeProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte5" },
    });
  });
  it("when stake amount is equal to 20 GTC for Silver", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("20000000000000000000");
    });

    const communitystaking = new CommunityStakingSilverProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte20" },
    });
  });
  it("when stake amount is equal to 125 GTC for Gold", async () => {
    jest.clearAllMocks();
    mockedAxiosPost.mockImplementation(async () => {
      return generateSubgraphResponse("125000000000000000000");
    });

    const communitystaking = new CommunityStakingGoldProvider();

    const communitystakingPayload = await communitystaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(communitystakingPayload).toMatchObject({
      valid: true,
      record: { address: MOCK_ADDRESS_LOWER, stakeAmount: "csgte125" },
    });
  });
});
