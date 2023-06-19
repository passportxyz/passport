// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import { EthErc20PossessionProvider } from "../../ETH/Providers/ethErc20Possession";

// ----- Ethers library
import * as units from "@ethersproject/units";

const mockBalanceOf = jest.fn();
jest.mock("ethers", () => {
  return {
    Contract: jest.fn().mockImplementation(() => {
      return {
        balanceOf: mockBalanceOf,
      };
    }),
  };
});

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const MOCK_FAKE_ADDRESS = "FAKE_ADDRESS";
const MOCK_BALANCE = "200000000000000000000";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBalanceOf.mockResolvedValue(MOCK_BALANCE);
  });

  it("should return valid response", async () => {
    const parseUnits = jest.spyOn(units, "parseUnits");

    const gtcPossessions = new EthErc20PossessionProvider({
      threshold: "100",
      recordAttribute: "gtcPossessionsGte",
      contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    });

    const verifiedPayload = await gtcPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(mockBalanceOf).toBeCalledWith(MOCK_ADDRESS_LOWER);
    // Check that parseUnits is called for threshold and balance
    expect(parseUnits).toBeCalledWith("100", 18);
    expect(parseUnits).toBeCalledWith(MOCK_BALANCE, 0);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        gtcPossessionsGte: "100",
      },
    });
  });

  it("should return false for an improper address", async () => {
    mockBalanceOf.mockRejectedValueOnce("0");
    const gtcPossessions = new EthErc20PossessionProvider({
      threshold: "100",
      recordAttribute: "gtcPossessionsGte",
      contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
      error: "GTC Possessions >= 100 Provider verify Error",
    });

    const verifiedPayload = await gtcPossessions.verify(
      {
        address: MOCK_FAKE_ADDRESS,
      } as RequestPayload,
      {}
    );

    expect(mockBalanceOf).toBeCalledWith(MOCK_FAKE_ADDRESS);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["GTC Possessions >= 100 Provider verify Error"],
    });
  });

  it("should return error response when balanceOf call throws an error", async () => {
    mockBalanceOf.mockRejectedValueOnce(new Error("some error"));
    const gtcPossessions = new EthErc20PossessionProvider({
      threshold: "100",
      recordAttribute: "gtcPossessionsGte",
      contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
      error: "GTC Possessions >= 100 Provider verify Error",
    });

    const verifiedPayload = await gtcPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(mockBalanceOf).toBeCalledWith(MOCK_ADDRESS_LOWER);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["GTC Possessions >= 100 Provider verify Error"],
    });
  });
});

describe("Check valid cases for GTC Balances", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBalanceOf.mockResolvedValue(MOCK_BALANCE);
  });

  it("Expected Greater than 10 GTC and GTC Balance is 15", async () => {
    mockBalanceOf.mockResolvedValueOnce("15000000000000000000");
    const gtcPossessions = new EthErc20PossessionProvider({
      threshold: "10",
      recordAttribute: "gtcPossessionsGte",
      contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    });

    const verifiedPayload = await gtcPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        gtcPossessionsGte: "10",
      },
    });
  });
  it("Expected Greater than 100 GTC and GTC Balance is 150", async () => {
    mockBalanceOf.mockResolvedValueOnce("150000000000000000000");
    const gtcPossessions = new EthErc20PossessionProvider({
      threshold: "100",
      recordAttribute: "gtcPossessionsGte",
      contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    });

    const verifiedPayload = await gtcPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        gtcPossessionsGte: "100",
      },
    });
  });
});

describe("Check invalid cases for GTC Balances", function () {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBalanceOf.mockResolvedValue(MOCK_BALANCE);
  });
  it("Expected Greater than 10 GTC and GTC Balance is 7", async () => {
    mockBalanceOf.mockResolvedValueOnce("7000000000000000000");
    const gtcPossessions = new EthErc20PossessionProvider({
      threshold: "10",
      recordAttribute: "gtcPossessionsGte",
      contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    });

    const verifiedPayload = await gtcPossessions.verify(
      {
        address: MOCK_ADDRESS,
      } as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
  it("Expected Greater than 100 GTC and GTC Balance is 75", async () => {
    mockBalanceOf.mockResolvedValueOnce("75000000000000000000");
    const gtcPossessions = new EthErc20PossessionProvider({
      threshold: "100",
      recordAttribute: "gtcPossessionsGte",
      contractAddress: "0xde30da39c46104798bb5aa3fe8b9e0e1f348163f",
    });

    const verifiedPayload = await gtcPossessions.verify(
      {
        address: MOCK_ADDRESS_LOWER,
      } as RequestPayload,
      {}
    );

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });
});
