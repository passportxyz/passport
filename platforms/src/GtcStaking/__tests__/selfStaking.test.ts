// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  SelfStakingBronzeProvider,
  SelfStakingSilverProvider,
  SelfStakingGoldProvider,
} from "../Providers/selfStaking";

// ----- Libs
import axios from "axios";
import { ProviderExternalVerificationError } from "../../types";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xae314CE417E25b4F744bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const round = 1;
const gtcStakingEndpoint = `${process.env.PASSPORT_SCORER_BACKEND}registry/gtc-stake`;
const apiKey = process.env.SCORER_API_KEY;

process.env.GTC_STAKING_ROUNDS =
  // eslint-disable-next-line prettier/prettier, quotes
  '[{"id": 4, "start": 1693526400, "duration": 7592340}, {"id": 5, "start": 1701118741, "duration": 8157658}]';

const invalidGtcStakingResponse = {
  status: 500,
  data: {},
};

const gtcStakingResponse = (gtcAmount: string) => {
  return {
    status: 200,
    data: {
      results: [
        {
          id: 0,
          event_type: "SelfStake",
          round_id: 1,
          staker: MOCK_ADDRESS,
          address: "0x1234",
          amount: gtcAmount,
          staked: true,
          block_number: 14124991,
          tx_hash: "0x1234",
        },
      ],
    },
  };
};

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    mockedAxios.get.mockResolvedValue(gtcStakingResponse("10"));

    const selfStakingProvider = new SelfStakingBronzeProvider();
    const verifiedPayload = await selfStakingProvider.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("handles invalid verification attempt where address is not proper ether address", async () => {
    const selfStakingProvider = new SelfStakingBronzeProvider();
    await expect(async () => {
      return await selfStakingProvider.verify(
        {
          address: "NOT_ADDRESS",
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow(new ProviderExternalVerificationError("Not a proper ethereum address"));
  });

  it("handles invalid subgraph response", async () => {
    mockedAxios.get.mockResolvedValueOnce(invalidGtcStakingResponse);
    const selfStakingProvider = new SelfStakingBronzeProvider();

    await expect(async () => {
      await selfStakingProvider.verify(
        {
          address: MOCK_ADDRESS_LOWER,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow("No results returned from the GTC Staking API");
  });

  it("handles invalid verification attempt where an exception is thrown", async () => {
    mockedAxios.get.mockImplementationOnce(() => {
      throw Error("SelfStakingBronze verifyStake Error");
    });
    const selfStakingProvider = new SelfStakingBronzeProvider();
    await expect(async () => {
      await selfStakingProvider.verify(
        {
          address: MOCK_ADDRESS_LOWER,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow("SelfStakingBronze verifyStake Error");
  });
});

// All the negative cases for thresholds are tested
describe("should return invalid payload", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when stake amount is below 5 GTC for Bronze", async () => {
    jest.clearAllMocks();
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("4"));
    });

    const gtcStakeAmount = gtcStakingResponse("4").data.results[0].amount;

    const selfstaking = new SelfStakingBronzeProvider();
    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: false,
      errors: [
        `Your current GTC self staking amount is ${gtcStakeAmount} GTC, which is below the required 5 GTC for this stamp.`,
      ],
    });
  });

  it("when stake amount is below 20 GTC for Silver", async () => {
    jest.clearAllMocks();
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("18"));
    });

    const gtcStakeAmount = gtcStakingResponse("18").data.results[0].amount;

    const selfstaking = new SelfStakingSilverProvider();
    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: false,
      errors: [
        `Your current GTC self staking amount is ${gtcStakeAmount} GTC, which is below the required 20 GTC for this stamp.`,
      ],
    });
  });

  it("when stake amount is below 125 GTC for Gold", async () => {
    jest.clearAllMocks();
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("122"));
    });

    const gtcStakeAmount = gtcStakingResponse("122").data.results[0].amount;

    const selfstaking = new SelfStakingGoldProvider();

    const selfstakingPayload = await selfstaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(selfstakingPayload).toMatchObject({
      valid: false,
      errors: [
        `Your current GTC self staking amount is ${gtcStakeAmount} GTC, which is below the required 125 GTC for this stamp.`,
      ],
    });
  });
});

// All the positive cases for thresholds are tested
describe("should return valid payload", function () {
  it("when stake amount above 5 GTC for Bronze", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("6"));
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
      record: { address: MOCK_ADDRESS_LOWER },
    });
  });
  it("when stake amount above 20 GTC for Silver", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("21"));
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
      record: { address: MOCK_ADDRESS_LOWER },
    });
  });
  it("when stake amount above 125 GTC for Gold", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("126"));
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
      record: { address: MOCK_ADDRESS_LOWER },
    });
  });
  // All amounts equal to tier amount
  it("when stake amount equal to 5 GTC for Bronze", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("5"));
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
      record: { address: MOCK_ADDRESS_LOWER },
    });
  });
  it("when stake amount equal to 20 GTC for Silver", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("20"));
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
      record: { address: MOCK_ADDRESS_LOWER },
    });
  });
  it("when stake amount equal to 125 GTC for Gold", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("125"));
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
      record: { address: MOCK_ADDRESS_LOWER },
    });
  });
});
