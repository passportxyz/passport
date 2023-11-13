// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import {
  BeginnerCommunityStakerProvider,
  ExperiencedCommunityStakerProvider,
  TrustedCitizenProvider,
} from "../Providers/communityStaking";

// ----- Libs
import axios from "axios";
import { Stake } from "../Providers/GtcStaking";
import { ProviderExternalVerificationError } from "../../types";

jest.mock("axios");

// jest.mock("@ipld/dag-cbor", () => {
//   const originalModule = jest.requireActual("@ipld/dag-cbor");
//   // Mock the specific function or value you need, for example:
//   return {
//     __esModule: true, // this property makes it work as an ES module
//     ...originalModule,
//     encode: jest.fn().mockReturnValue("mocked encoded value"), // mock encode function
//     decode: jest.fn().mockReturnValue({ /* mocked decoded value */ }), // mock decode function
//   };
// });

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();

const invalidGtcStakingResponse = {
  status: 500,
  data: {},
};

const gtcStakingResponse = (gtcAmount: string, n: number, communityType: string) => {
  const results: Stake[] = [];
  const stakingResponse = {
    status: 200,
    data: {
      results,
    },
  };
  const bcs = "BeginnerCommunityStaker";
  const ecs = "ExperiencedCommunityStaker";
  const tc = "TrustedCitizen";
  for (let i = 0; i < n; i++) {
    switch (communityType) {
      case bcs:
        results.push({
          id: i,
          event_type: "Xstake",
          round_id: 1,
          staker: MOCK_ADDRESS_LOWER,
          address: "0x6c5c1ce496c5164fef46c715c4a2d691bd9a1adb",
          amount: gtcAmount,
          staked: true,
          block_number: 14124991,
          tx_hash: `0x1234${i}`,
        });
        break;
      case ecs:
        results.push({
          id: i,
          event_type: "Xstake",
          round_id: 1,
          staker: MOCK_ADDRESS_LOWER,
          address: "0x6c5c1ce496c5164fef46c715c4a2d691bd9a1adb",
          amount: gtcAmount,
          staked: true,
          block_number: 14124991,
          tx_hash: `0x1235${i}`,
        });
        results.push({
          id: i + 6,
          event_type: "Xstake",
          round_id: 1,
          staker: "0x6c5c1ce496c5164fef46c715c4a2d691bd9a1adb",
          address: MOCK_ADDRESS_LOWER,
          amount: gtcAmount,
          staked: true,
          block_number: 14124991,
          tx_hash: `0x1234${i}`,
        });
        break;
      case tc:
        results.push({
          id: i,
          event_type: "Xstake",
          round_id: 1,
          staker: `0x6c5c1${i}e496c5164fef46c7${i}5c4a2d691bd9a${i}adb`,
          address: MOCK_ADDRESS_LOWER,
          amount: gtcAmount,
          staked: true,
          block_number: 14124991,
          tx_hash: `0x1234${i}`,
        });
        break;
      default:
        break;
    }
  }
  return stakingResponse;
};

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("5", 1, "BeginnerCommunityStaker"));
    });

    const bcsStaking = new BeginnerCommunityStakerProvider();
    const bcsStakingPayload = await bcsStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(bcsStakingPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("handles invalid verification attempt where address is not proper ether address", async () => {
    const communityStakingProvider = new BeginnerCommunityStakerProvider();
    await expect(async () => {
      return await communityStakingProvider.verify(
        {
          address: "not_address",
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow("Not a proper ethereum address");
  });

  it("handles invalid endpoint response", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(invalidGtcStakingResponse);
    });
    const communityStakingProvider = new BeginnerCommunityStakerProvider();
    await expect(async () => {
      return await communityStakingProvider.verify(
        {
          address: MOCK_ADDRESS_LOWER,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow(ProviderExternalVerificationError);
  });

  it("should combine stakes where applicable", async () => {
    jest.clearAllMocks();
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        data: {
          results: [
            {
              id: 1,
              event_type: "Xstake",
              round_id: 1,
              staker: MOCK_ADDRESS_LOWER,
              address: "0x6c5c1ce496c5164fef46c715c4a2d691bd9a1adb",
              amount: "3",
              staked: true,
              block_number: 14124991,
              tx_hash: "0x12345",
            },
            {
              id: 2,
              event_type: "Xstake",
              round_id: 1,
              staker: MOCK_ADDRESS_LOWER,
              address: "0x6c5c1ce496c5164fef46c715c4a2d691bd9a1adb",
              amount: "3",
              staked: true,
              block_number: 14124992,
              tx_hash: "0x12346",
            },
          ],
        },
      });
    });

    const bcStaking = new BeginnerCommunityStakerProvider();
    const bcStakingPayload = await bcStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(bcStakingPayload).toMatchObject({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });
});

// All the negative case for thresholds are tested
describe("should return invalid payload", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when a user is staking on someone else or is staked on below 5 GTC for BeginnerCommunityStaker", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("2", 1, "BeginnerCommunityStaker"));
    });

    const bcStaking = new BeginnerCommunityStakerProvider();
    const bcStakingPayload = await bcStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(bcStakingPayload).toMatchObject({
      valid: false,
      errors: [
        "There are currently 0 community stakes of at least 5 GTC on/by your address, you need a minimum of 1 relevant community stakes to claim this stamp",
      ],
    });
  });

  it("when a user is staking on 2 community members or is staked on by 2 community members below 10 GTC for ExperiencedCommunityStaker", async () => {
    jest.clearAllMocks();
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("4", 1, "ExperiencedCommunityStaker"));
    });

    const ecsStaking = new ExperiencedCommunityStakerProvider();
    const ecsStakingPayload = await ecsStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(ecsStakingPayload).toMatchObject({
      valid: false,
      errors: [
        "There are currently 0 community stakes of at least 10 GTC on/by your address, you need a minimum of 2 relevant community stakes to claim this stamp",
      ],
    });
  });

  it("when user is staked on by less than 5 community members with 20 GTC for TrustedCitizen", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("25", 4, "TrustedCitizen"));
    });

    const tcStaking = new TrustedCitizenProvider();
    const tcStakingPayload = await tcStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(tcStakingPayload).toMatchObject({
      valid: false,
      errors: [
        "There are currently 4 community stakes of at least 20 GTC on/by your address, you need a minimum of 5 relevant community stakes to claim this stamp",
      ],
    });
  });

  it("should comprehend unstaking", async () => {
    jest.clearAllMocks();
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        data: {
          results: [
            {
              id: 1,
              event_type: "Xstake",
              round_id: 1,
              staker: MOCK_ADDRESS_LOWER,
              address: "0x6c5c1ce496c5164fef46c715c4a2d691bd9a1adb",
              amount: "10",
              staked: true,
              block_number: 14124991,
              tx_hash: "0x12345",
            },
            {
              id: 2,
              event_type: "Xstake",
              round_id: 1,
              staker: MOCK_ADDRESS_LOWER,
              address: "0x6c5c1ce496c5164fef46c715c4a2d691bd9a1adb",
              amount: "6",
              staked: false,
              block_number: 14124992,
              tx_hash: "0x12346",
            },
          ],
        },
      });
    });

    const bcStaking = new BeginnerCommunityStakerProvider();
    const bcStakingPayload = await bcStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(bcStakingPayload).toMatchObject({
      valid: false,
      errors: [
        "There are currently 0 community stakes of at least 5 GTC on/by your address, you need a minimum of 1 relevant community stakes to claim this stamp",
      ],
    });
  });
});

// All the positive cases for thresholds are tested
describe("should return valid payload", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("when user stakes more than 5 GTC on another community member for BeginnerCommunityStaker", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("7", 1, "BeginnerCommunityStaker"));
    });

    const bcsStaking = new BeginnerCommunityStakerProvider();
    const bcsStakingPayload = await bcsStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(bcsStakingPayload).toMatchObject({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("when more than 10 GTC is staked on a community member and a community member stakes more than 10 GTC on the user for ExperiencedCommunityStaker", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("15", 1, "ExperiencedCommunityStaker"));
    });

    const ecsStaking = new ExperiencedCommunityStakerProvider();
    const ecsStakingPayload = await ecsStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(ecsStakingPayload).toMatchObject({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("when more than 5 community members stake more than 20 GTC on the user for TrustedCitizen", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("25", 9, "TrustedCitizen"));
    });

    const tcStaking = new TrustedCitizenProvider();
    const tcStakingPayload = await tcStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(tcStakingPayload).toMatchObject({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });
  // All values equal to tier amount
  it("when the user stakes exactly 5 GTC on a community member for BeginnerCommunityStaker", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("5", 1, "BeginnerCommunityStaker"));
    });

    const bcsStaking = new BeginnerCommunityStakerProvider();
    const bcsStakingPayload = await bcsStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(bcsStakingPayload).toMatchObject({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("when a community member stakes exactly 10 GTC on the user and the user stakes exactly 10 GTC on them for ExperiencedCommunityStaker", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("10", 1, "ExperiencedCommunityStaker"));
    });

    const ecsStaking = new ExperiencedCommunityStakerProvider();
    const ecsStakingPayload = await ecsStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(ecsStakingPayload).toMatchObject({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("when exactly 5 unique community members stake exactly 20 GTC on the user for TrustedCitizen", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve(gtcStakingResponse("20", 5, "TrustedCitizen"));
    });

    const tcStaking = new TrustedCitizenProvider();
    const tcStakingPayload = await tcStaking.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(tcStakingPayload).toMatchObject({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });
});
