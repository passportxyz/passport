import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import {
  ETHAdvocateProvider,
  ETHPioneerProvider,
  ETHMaxiProvider,
  ModelResponse,
  getETHAnalysis,
  ETHEnthusiastProvider,
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

  it("should validate inputs for ETHEnthusiastProvider", async () => {
    const mockedResponse = mockResponse(1);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    const ethAdvocateProvider = new ETHEnthusiastProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate inputs for ETHPioneerProvider", async () => {
    const mockedResponse = mockResponse(25);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);

    const ethAdvocateProvider = new ETHPioneerProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate inputs for ETHAdvocateProvider", async () => {
    const mockedResponse = mockResponse(50);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ETHAdvocateProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate inputs for ETHMaxiProvider", async () => {
    jest.clearAllMocks();
    const mockedResponse = mockResponse(88);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ETHMaxiProvider();
    const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

    expect(payload.valid).toBe(true);
    expect(payload.record).toEqual({ address: mockAddress });
  });

  it("should validate invalid inputs for ETHMaxiProvider", async () => {
    const mockedResponse = mockResponse(70);
    mockedAxios.post.mockResolvedValueOnce(mockedResponse);
    const ethAdvocateProvider = new ETHMaxiProvider();
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
      const mockedResponse = mockResponse(80);
      mockedAxios.post.mockResolvedValueOnce(mockedResponse);
      mockContext = {};
      const response1 = await getETHAnalysis(mockAddress, mockContext);
      const response2 = await getETHAnalysis(mockAddress, mockContext);
      expect(response1.human_probability).toEqual(80);
      expect(response2.human_probability).toEqual(80);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });
});
