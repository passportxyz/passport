import { BinanceProvider } from "../Providers/binance";
import axios from "axios";
import * as ethers from "ethers";
import { getRPCProvider } from "../../utils/signer";
import { RequestPayload } from "@gitcoin/passport-types";

jest.mock("axios");
jest.mock("../../utils/signer");
jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    __esModule: true,
    ...originalModule,
    Contract: jest.fn(),
  };
});

describe("BinanceProvider", () => {
  let binanceProvider: BinanceProvider;

  beforeEach(() => {
    binanceProvider = new BinanceProvider();
    jest.clearAllMocks();
  });

  describe("verify", () => {
    it("should return valid payload when BABT is found", async () => {
      const mockTokenId = "123456";
      const mockBABTId = "0x7163ade991102bea82c6c5321c0cfd742657a011948c2ded1a041b14f173f0f0";

      (ethers.Contract as unknown as jest.Mock).mockImplementation(() => ({
        tokenIdOf: jest.fn().mockResolvedValue(ethers.BigNumber.from(mockTokenId)),
      }));

      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          id: mockBABTId,
        },
      });

      const result = await binanceProvider.verify({
        address: "0x1234567890",
      } as RequestPayload);

      const expected = {
        valid: true,
        record: {
          id: mockBABTId,
        },
      };

      expect(result).toEqual(expected);
    });

    it("should return invalid payload when BABT is not found", async () => {
      const mockTokenId = "123456";

      (ethers.Contract as unknown as jest.Mock).mockImplementation(() => ({
        tokenIdOf: jest.fn().mockResolvedValue(ethers.BigNumber.from(mockTokenId)),
      }));

      (axios.get as jest.Mock).mockResolvedValue({
        data: {},
      });

      const result = await binanceProvider.verify({
        address: "0x1234567890",
      } as RequestPayload);

      const expected = {
        valid: false,
        errors: ["BABT not found"],
      };

      expect(result).toEqual(expected);
    });

    it("should return invalid payload when an error occurs", async () => {
      (ethers.Contract as unknown as jest.Mock).mockImplementation(() => ({
        tokenIdOf: jest.fn().mockRejectedValue(new Error("The wallet has not attested any SBT")),
      }));

      const result = await binanceProvider.verify({
        address: "0x1234567890",
      } as RequestPayload);

      const expected = {
        valid: false,
        errors: ["The wallet has not attested any SBT"],
      };

      expect(result).toEqual(expected);
    });
  });

  describe("getBABTId", () => {
    it("should return BABT ID when found", async () => {
      const mockTokenId = "123456";
      const mockBABTId = "0x7163ade991102bea82c6c5321c0cfd742657a011948c2ded1a041b14f173f0f0";

      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          id: mockBABTId,
        },
      });

      const result = await binanceProvider.getBABTId(mockTokenId);

      expect(result).toBe(mockBABTId);
    });

    it("should return undefined when BABT ID is not found", async () => {
      const mockTokenId = "123456";

      (axios.get as jest.Mock).mockResolvedValue({
        data: {},
      });

      const result = await binanceProvider.getBABTId(mockTokenId);

      expect(result).toBeUndefined();
    });
  });

  describe("getTokenId", () => {
    it("should return token ID for a given address", async () => {
      const mockAddress = "0x1234567890";
      const mockTokenId = "123456";

      (getRPCProvider as jest.Mock).mockReturnValue({});

      (ethers.Contract as unknown as jest.Mock).mockImplementation(() => ({
        tokenIdOf: jest.fn().mockResolvedValue(ethers.BigNumber.from(mockTokenId)),
      }));

      const result = await binanceProvider.getTokenId(mockAddress);

      expect(result).toEqual({ tokenId: mockTokenId });
      expect(getRPCProvider).toHaveBeenCalledWith(expect.any(String));
      expect(ethers.Contract).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Object));
    });

    it("should throw an error when contract call fails", async () => {
      const mockAddress = "0x1234567890";

      (getRPCProvider as jest.Mock).mockReturnValue({});

      (ethers.Contract as unknown as jest.Mock).mockImplementation(() => ({
        tokenIdOf: jest.fn().mockRejectedValue(new Error("The wallet has not attested any SBT")),
      }));

      expect(await binanceProvider.getTokenId(mockAddress)).toEqual({
        tokenId: "",
        error: ["The wallet has not attested any SBT"],
      });
    });
  });
});
