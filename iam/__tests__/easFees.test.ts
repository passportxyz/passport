import { getEASFeeAmount } from "../src/utils/easFees";
import { utils } from "ethers";
import Moralis from "moralis";

jest.mock("moralis", () => ({
  EvmApi: {
    token: {
      getTokenPrice: jest.fn().mockResolvedValue({
        result: { usdPrice: 3000 },
      }),
    },
  },
}));

describe("EthPriceLoader", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.advanceTimersByTime(1000 * 60 * 6); // Advance by 6 minutes
    jest.clearAllMocks();
  });

  describe("getEASFeeAmount", () => {
    it("should calculate the correct EAS Fee amount based on the current ETH price", async () => {
      const usdFeeAmount = 2;
      const result = await getEASFeeAmount(usdFeeAmount);

      const expectedEthFeeAmount = usdFeeAmount / 3000;
      const expectedBigNumberValue = utils.parseEther(expectedEthFeeAmount.toFixed(18));

      expect(result).toEqual(expectedBigNumberValue);
    });

    it("should handle Moralis errors gracefully", async () => {
      (Moralis.EvmApi.token.getTokenPrice as jest.Mock).mockRejectedValueOnce(new Error("Failed fetching price"));

      await expect(getEASFeeAmount(2)).rejects.toThrow("Failed to get ETH price");
    });
  });

  it("should call Moralis API only once if getEASFeeAmount is called multiple times in succession before cachePeriod is reached", async () => {
    await getEASFeeAmount(2);
    await getEASFeeAmount(3);
    await getEASFeeAmount(4);

    expect(Moralis.EvmApi.token.getTokenPrice).toHaveBeenCalledTimes(1);
  });

  it("should call Moralis API again if cachePeriod is exceeded", async () => {
    // We're making the first call
    await getEASFeeAmount(2);

    // Fast-forwarding time to exceed the cache period of 5 minutes
    jest.advanceTimersByTime(1000 * 60 * 6); // Advance by 6 minutes

    // Making the second call after the cache period
    await getEASFeeAmount(2);

    expect(Moralis.EvmApi.token.getTokenPrice).toHaveBeenCalledTimes(2);
  });
});
