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
}): { data: ModelResponse } => ({
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

describe("AccountAnalysis Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {};
  });

  it("should validate inputs for ETHEnthusiastProvider", async () => {
    const mockedResponse = mockResponse({ score: 50 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    const ethAdvocateProvider = new ETHEnthusiastProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate inputs for ETHAdvocateProvider", async () => {
    const mockedResponse = mockResponse({ score: 92 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ETHAdvocateProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate inputs for ETHMaxiProvider", async () => {
    jest.clearAllMocks();
    const mockedResponse = mockResponse({ score: 98 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ETHMaxiProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate invalid inputs for ETHMaxiProvider", async () => {
    const mockedResponse = mockResponse({ score: 70 });
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ETHMaxiProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(false);
    expect(payload.errors).toBeDefined();
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
    jest.clearAllMocks();
    mockedAxios.post.mockRejectedValueOnce(new Error("Test Error"));
    const ethAdvocateProvider = new ETHMaxiProvider();
    await expect(ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext)).rejects.toThrow();
  });

  describe("getETHAnalysis", () => {
    it("should use value from context if present", async () => {
      const mockedResponse = mockResponse({ score: 80 });
      mockedAxios.post.mockResolvedValueOnce(mockedResponse);
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
