import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import { ETHAdvocateProvider, ETHPioneerProvider, ETHMaxiProvider, ModelResponse } from "../Providers/accountAnalysis";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockAddress = "0x0";
const mockContext = {};
const mockResponse = (score: number): ModelResponse => ({
  data: {
    human_probability: score,
  },
});

describe("AccountAnalysis Providers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ETH Account Analysis", () => {
    it("should validate inputs for ETHAdvocateProvider", async () => {
      mockedAxios.get.mockResolvedValue(mockResponse(0.6));
      const ethAdvocateProvider = new ETHAdvocateProvider();
      const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

      expect(payload.valid).toBe(true);
      expect(payload.record).toEqual({ address: mockAddress });
    });

    it("should validate inputs for ETHPioneerProvider", async () => {
      mockedAxios.get.mockResolvedValue(mockResponse(0.8));
      const ethAdvocateProvider = new ETHPioneerProvider();
      const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

      expect(payload.valid).toBe(true);
      expect(payload.record).toEqual({ address: mockAddress });
    });

    it("should validate inputs for ETHMaxiProvider", async () => {
      mockedAxios.get.mockResolvedValue(mockResponse(1));
      const ethAdvocateProvider = new ETHMaxiProvider();
      const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

      expect(payload.valid).toBe(true);
      expect(payload.record).toEqual({ address: mockAddress });
    });

    it("should validate invalid inputs for ETHMaxiProvider", async () => {
      mockedAxios.get.mockResolvedValue(mockResponse(0.99));
      const ethAdvocateProvider = new ETHMaxiProvider();
      const payload = await ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext);

      expect(payload.valid).toBe(false);
      expect(payload.errors).toBeDefined();
    });
  });
  it("should handle errors gracefully", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Test Error"));
    const ethAdvocateProvider = new ETHMaxiProvider();
    await expect(
      ethAdvocateProvider.verify({ address: mockAddress } as RequestPayload, mockContext)
    ).rejects.toThrowError();
  });
});
