/* eslint-disable */
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import { EthErc20PossessionProvider } from "../Providers/ethErc20Possession";

// ----- Ethers library
import * as units from "@ethersproject/units";
import { ProviderExternalVerificationError } from "../../types";

const mockGetBalance = jest.fn();
jest.mock("@ethersproject/providers", () => {
  return {
    StaticJsonRpcProvider: jest.fn().mockImplementation(() => {
      return {
        getBalance: mockGetBalance,
      };
    }),
  };
});

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const MOCK_FAKE_ADDRESS = "FAKE_ADDRESS";
const MOCK_BALANCE_ETH = units.parseUnits("200", 18);

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue(MOCK_BALANCE_ETH);
  });

  it("should return valid response", async () => {
    const parseUnits = jest.spyOn(units, "parseUnits");

    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "1",
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(mockGetBalance).toBeCalledWith(MOCK_ADDRESS_LOWER);
    // expect parseUnits to be called for threshold
    expect(parseUnits).toBeCalledWith("1", 18);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "1",
      },
      errors: [],
    });
  });

  it("should return false for an improper address", async () => {
    mockGetBalance.mockImplementationOnce((address) => {
      if (address === MOCK_ADDRESS_LOWER) return MOCK_BALANCE_ETH;
    });
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "1",
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify(
      {
        address: MOCK_FAKE_ADDRESS,
      } as RequestPayload,
      {}
    );

    expect(mockGetBalance).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      record: undefined,
      errors: ["Eth Possession Provider Error"],
    });
  });

  it("should return error response when getBalance call throws an error", async () => {
    mockGetBalance.mockRejectedValueOnce(new Error("some error"));
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "1",
      recordAttribute: "ethPossessionsGte",
      error: "ETH Possessions >= 1 Provider verify Error",
    });

    expect(async () => {
      await ethPossessions.verify(
        {
          address: MOCK_ADDRESS_LOWER,
        } as unknown as RequestPayload,
        {}
      );
    }).rejects.toThrow(new ProviderExternalVerificationError("Error validating ETH amounts: Error: some error"));
    expect(mockGetBalance).toBeCalledWith(MOCK_ADDRESS_LOWER);
  });
});

describe("Check valid cases for ETH Balances", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue(MOCK_BALANCE_ETH);
  });

  it("Expected Greater than 1 ETH and ETH Balance is 5", async () => {
    mockGetBalance.mockResolvedValueOnce(units.parseUnits("5", 18));
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "1",
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "1",
      },
      errors: [],
    });
  });
  it("Expected Greater than 10 ETH and ETH Balance is 15", async () => {
    mockGetBalance.mockResolvedValueOnce(units.parseUnits("15", 18));
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "10",
      recordAttribute: "ethPossessionsGte",
    });
    const verifiedPayload = await ethPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "10",
      },
      errors: [],
    });
  });
  it("Expected Greater than 32 ETH and ETH Balance is 70", async () => {
    mockGetBalance.mockResolvedValueOnce(units.parseUnits("70", 18));

    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "32",
      recordAttribute: "ethPossessionsGte",
    });
    const verifiedPayload = await ethPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "32",
      },
      errors: [],
    });
  });
});

describe("Check invalid cases for ETH Balances", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue(MOCK_BALANCE_ETH);
  });
  it("Expected Greater than 1 ETH and ETH Balance is 0.5", async () => {
    mockGetBalance.mockResolvedValueOnce(units.parseUnits("0.5", 18));
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "1",
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify(
      {
        address: MOCK_ADDRESS,
      } as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      record: undefined,
      errors: ["You do not hold the required amount of ETH for this stamp. Your ETH: 500000000000000000."],
    });
  });
  it("Expected Greater than 10 ETH and ETH Balance is 5", async () => {
    mockGetBalance.mockResolvedValueOnce(units.parseUnits("5", 18));
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "10",
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify(
      {
        address: MOCK_ADDRESS,
      } as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      record: undefined,
      errors: ["You do not hold the required amount of ETH for this stamp. Your ETH: 5000000000000000000."],
    });
  });
  it("Expected Greater than 32 ETH and ETH Balance is 20", async () => {
    mockGetBalance.mockResolvedValueOnce(units.parseUnits("20", 18));
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: "32",
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify(
      {
        address: MOCK_ADDRESS,
      } as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      record: undefined,
      errors: ["You do not hold the required amount of ETH for this stamp. Your ETH: 20000000000000000000."],
    });
  });
});
