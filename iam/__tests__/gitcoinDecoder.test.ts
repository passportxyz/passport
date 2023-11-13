import { BigNumber } from "ethers";
import { GitcoinPassportDecoder } from "../src/utils/gitcoinDecoder";
import { PassportCache } from "@gitcoin/passport-platforms";

jest.mock("@ethersproject/providers");
jest.mock("moralis");
jest.mock("@gitcoin/passport-platforms");

jest.spyOn(PassportCache.prototype, "init").mockImplementation(() => Promise.resolve());

jest.mock("ethers", () => {
  return {
    ...jest.requireActual("ethers"),
    Contract: jest.fn().mockImplementation(() => {
      return {
        getProviders: () => ["ON_CHAIN_PROVIDER"],
      };
    }),
  };
});

describe("GitcoinPassportDecoder", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.advanceTimersByTime(1000 * 60 * 6); // Advance by 6 minutes
    jest.clearAllMocks();
  });

  describe("onChainProviders", () => {
    it("should return the correct onChainProviders from cache", async () => {
      const provider = ["PROVIDER"];
      jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
        if (key === "decodedProviders") {
          return Promise.resolve(JSON.stringify(provider));
        } else if (key === "decodedProvidersLastUpdate") {
          return Promise.resolve(null);
        }
      });
      const providerVersion = BigNumber.from(1);
      const decoder = new GitcoinPassportDecoder("0x14a33");
      await decoder.init();
      const result = await decoder.onChainProviders(providerVersion);
      expect(result).toEqual(provider);
    });
    it("should fetch the correct onChainProviders from cache", async () => {
      const provider = ["ON_CHAIN_PROVIDER"];
      jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
        if (key === "decodedProviders") {
          return Promise.resolve(null);
        } else if (key === "decodedProvidersLastUpdate") {
          return Promise.resolve(null);
        }
      });
      const providerVersion = BigNumber.from(1);
      const decoder = new GitcoinPassportDecoder("0x14a33");
      await decoder.init();
      const result = await decoder.onChainProviders(providerVersion);
      expect(result).toEqual(provider);
    });
    it("should return the providers from the contract if cached value is  > 12 hrs old", async () => {
      const provider = ["ON_CHAIN_PROVIDER"];
      jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
        if (key === "decodedProviders") {
          return Promise.resolve(null);
        } else if (key === "decodedProvidersLastUpdate") {
          return Promise.resolve((Date.now() - 1000 * 60 * 60 * 12).toString());
        }
      });
      const providerVersion = BigNumber.from(1);
      const decoder = new GitcoinPassportDecoder("0x14a33");
      await decoder.init();
      const result = await decoder.onChainProviders(providerVersion);
      expect(result).toEqual(provider);
    });
  });
});
