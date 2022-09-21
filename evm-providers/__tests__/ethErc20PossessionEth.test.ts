import { JsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";
// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import { EthErc20PossessionProvider } from "../src/providers/ethErc20Possession";

// ----- Ethers library
import { formatUnits } from "@ethersproject/units";

import { mock } from "jest-mock-extended";

jest.mock("@ethersproject/units", () => ({
  formatUnits: jest.fn(),
}));

const mockGetBalance = jest.fn();
jest.mock("@ethersproject/providers", () => {
  return {
    StaticJsonRpcProvider: jest.fn().mockImplementation(() => {
      return {
        getBalance: mockGetBalance,
      };
    }),
    JsonRpcSigner: jest.fn().mockImplementation(() => {
      return {
        getBalance: mockGetBalance,
      };
    }),
  };
});

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const MOCK_FAKE_ADDRESS = "FAKE_ADDRESS";
const MOCK_BALANCE = "200000000000000000000";

const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue(MOCK_BALANCE);
    (formatUnits as jest.Mock).mockImplementation((num: string, power: number) => {
      return parseFloat(num) / Math.pow(10, power);
    });
  });

  it("should return valid response with signer", async () => {
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 1,
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify({
      jsonRPCSigner: mockSigner,
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(mockGetBalance).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(formatUnits).toBeCalledWith(MOCK_BALANCE, 18);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "1",
      },
    });
  });

  it("should return valid response", async () => {
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 1,
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(mockGetBalance).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(formatUnits).toBeCalledWith(MOCK_BALANCE, 18);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "1",
      },
    });
  });

  it("should return false for an improper address", async () => {
    mockGetBalance.mockImplementationOnce((address) => {
      if (address === MOCK_ADDRESS_LOWER) return MOCK_BALANCE;
    });
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 1,
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_FAKE_ADDRESS,
    } as RequestPayload);

    expect(mockGetBalance).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });

  it("should return error response when getBalance call throws an error", async () => {
    mockGetBalance.mockRejectedValueOnce(new Error("some error"));
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 1,
      recordAttribute: "ethPossessionsGte",
      error: "ETH Possessions >= 1 Provider verify Error",
    });
    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(mockGetBalance).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["ETH Possessions >= 1 Provider verify Error"],
    });
  });
});

describe("Check valid cases for ETH Balances", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue(MOCK_BALANCE);
    (formatUnits as jest.Mock).mockImplementation((num: string, power: number) => {
      return parseFloat(num) / Math.pow(10, power);
    });
  });

  it("Expected Greater than 1 ETH and ETH Balance is 5", async () => {
    mockGetBalance.mockResolvedValueOnce("5000000000000000000");
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 1,
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "1",
      },
    });
  });
  it("Expected Greater than 10 ETH and ETH Balance is 15", async () => {
    mockGetBalance.mockResolvedValueOnce("15000000000000000000");
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 10,
      recordAttribute: "ethPossessionsGte",
    });
    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "10",
      },
    });
  });
  it("Expected Greater than 32 ETH and ETH Balance is 70", async () => {
    mockGetBalance.mockResolvedValueOnce("70000000000000000000");

    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 32,
      recordAttribute: "ethPossessionsGte",
    });
    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        ethPossessionsGte: "32",
      },
    });
  });
});

describe("Check invalid cases for ETH Balances", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue(MOCK_BALANCE);
    (formatUnits as jest.Mock).mockImplementation((num: string, power: number) => {
      return parseFloat(num) / Math.pow(10, power);
    });
  });
  it("Expected Greater than 1 ETH and ETH Balance is 0.5", async () => {
    mockGetBalance.mockResolvedValueOnce("500000000000000000");
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 1,
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
  it("Expected Greater than 10 ETH and ETH Balance is 5", async () => {
    mockGetBalance.mockResolvedValueOnce("5000000000000000000");
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 10,
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
  it("Expected Greater than 32 ETH and ETH Balance is 20", async () => {
    mockGetBalance.mockResolvedValueOnce("2000000000000000000");
    const ethPossessions = new EthErc20PossessionProvider({
      threshold: 32,
      recordAttribute: "ethPossessionsGte",
    });

    const verifiedPayload = await ethPossessions.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
});
