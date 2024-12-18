import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import {
  ETHAdvocateProvider,
  ETHMaxiProvider,
  ModelResponse,
  getETHAnalysis,
  ETHEnthusiastProvider,
  EthDaysActiveProvider,
  EthGasSpentProvider,
  EthTransactionsProvider,
} from "../Providers/accountAnalysis";

const mockAddress = "0x0";
let mockContext = {};
const mockResponse = ({
  score,
  gasSpent,
  numberDaysActive,
  numberTransactions,
}: {
  score?: number;
  gasSpent?: number;
  numberDaysActive?: number;
  numberTransactions?: number;
}): { status:number, data: ModelResponse } => ({
  status: 200,
  data: {
    data: {
      human_probability: score || 0,
      gas_spent: gasSpent || 0,
      n_days_active: numberDaysActive || 0,
      n_transactions: numberTransactions || 0,
    },
  },
});

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const scoreTestCases = [
  //[score, [result for ETHEnthusiastProvider, result for ETHAdvocateProvider, result for ETHMaxiProvider]]
  [0, [false, false, false]],
  [1, [false, false, false]],
  [50, [true, false, false]],
  [75, [true, true, false]],
  [88, [true, true, false]],
  [90, [true, true, true]],
  [100, [true, true, true]],
]
  .map(([score, expected]: [number, boolean[]]) => {
    return [
      [score, expected[0], ETHEnthusiastProvider],
      [score, expected[1], ETHAdvocateProvider],
      [score, expected[2], ETHMaxiProvider],
    ];
  })
  .flat() as [number, boolean, typeof ETHEnthusiastProvider | typeof ETHAdvocateProvider | typeof ETHMaxiProvider][];

describe("AccountAnalysis Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {};
  });

  describe("should check human_probability", () => {
    it.each(scoreTestCases)("for score %i should return %s for %p", async (score, expected, provider) => {
      const mockedResponse = mockResponse({ score });
      mockedAxios.post.mockResolvedValue(mockedResponse);
      const ethAdvocateProvider = new provider();
      const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

      expect(payload.valid).toBe(expected);
      if (expected) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(payload.record).toEqual({ address: mockAddress });
      }
    });
  });

  it("should validate inputs for EthDaysActiveProvider", async () => {
    const mockedResponse = mockResponse({ numberDaysActive: 50 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new EthDaysActiveProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
  });

  it("should fail invalid inputs for EthDaysActiveProvider", async () => {
    const mockedResponse = mockResponse({ numberDaysActive: 15 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new EthDaysActiveProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(false);
    expect(payload.errors).toBeDefined();
  });

  it("should validate inputs for EthGasSpentProvider", async () => {
    const mockedResponse = mockResponse({ gasSpent: 0.25 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new EthGasSpentProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
  });

  it("should fail invalid inputs for EthGasSpentProvider", async () => {
    const mockedResponse = mockResponse({ gasSpent: 0.1 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new EthGasSpentProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(false);
    expect(payload.errors).toBeDefined();
  });

  it("should validate inputs for EthTransactionsProvider", async () => {
    const mockedResponse = mockResponse({ numberTransactions: 100 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new EthTransactionsProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
  });

  it("should fail invalid inputs for EthTransactionsProvider", async () => {
    const mockedResponse = mockResponse({ numberTransactions: 50 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new EthTransactionsProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(false);
    expect(payload.errors).toBeDefined();
  });

  it("should handle errors gracefully", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Test Error"));
    const ethAdvocateProvider = new ETHMaxiProvider();
    await expect(ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext)).rejects.toThrow();
  });

  describe("getETHAnalysis", () => {
    it("should use value from context if present", async () => {
      const mockedResponse = mockResponse({ score: 80 });
      mockedAxios.post.mockResolvedValue(mockedResponse);
      mockContext = {};
      const response1 = await getETHAnalysis(mockAddress, mockContext);
      const response2 = await getETHAnalysis(mockAddress, mockContext);
      expect(response1.humanProbability).toEqual(80);
      expect(response2.humanProbability).toEqual(80);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });
});
