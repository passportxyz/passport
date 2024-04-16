import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import {
  ZkSyncScore20Provider,
  ZkSyncScore50Provider,
  ModelResponse,
  getZkSyncAnalysis,
  ZkSyncScore5Provider,
} from "../Providers/accountAnalysis";

const mockAddress = "0x0";
let mockContext = {};
const mockResponse = (score: number): { data: ModelResponse } => ({
  data: {
    data: {
      human_probability: score,
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

  it("should validate inputs for ZkSyncScore5Provider", async () => {
    const mockedResponse = mockResponse(5);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    const ethAdvocateProvider = new ZkSyncScore5Provider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate inputs for ZkSyncScore20Provider", async () => {
    const mockedResponse = mockResponse(50);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ZkSyncScore20Provider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate inputs for ZkSyncScore50Provider", async () => {
    jest.clearAllMocks();
    const mockedResponse = mockResponse(88);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ZkSyncScore50Provider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate invalid inputs for ZkSyncScore50Provider", async () => {
    const mockedResponse = mockResponse(40);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ZkSyncScore50Provider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(false);
    expect(payload.errors).toBeDefined();
  });
  it("should handle errors gracefully", async () => {
    jest.clearAllMocks();
    mockedAxios.post.mockRejectedValueOnce(new Error("Test Error"));
    const ethAdvocateProvider = new ZkSyncScore50Provider();
    await expect(ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext)).rejects.toThrow();
  });
  describe("getZkSyncAnalysis", () => {
    it("should use value from context if present", async () => {
      const mockedResponse = mockResponse(80);
      mockedAxios.post.mockResolvedValueOnce(mockedResponse);
      mockContext = {};
      const response1 = await getZkSyncAnalysis(mockAddress, mockContext);
      const response2 = await getZkSyncAnalysis(mockAddress, mockContext);
      expect(response1.humanProbability).toEqual(80);
      expect(response2.humanProbability).toEqual(80);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });
});
