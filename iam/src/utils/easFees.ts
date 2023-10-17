import { utils } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import Moralis from "moralis";
import { IAMError } from "./scorerService";
import PassportCache from "./cache";

const FIVE_MINUTES = 1000 * 60 * 5;
const WETH_CONTRACT = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

class EthPriceLoader extends PassportCache {
  cachedPrice: number;
  lastUpdated: number;
  cachePeriod = FIVE_MINUTES;

  constructor() {
    super();
    this.cachedPrice = 0;
    this.lastUpdated = 0;
  }

  async getPrice(): Promise<number> {
    if (await this.#needsUpdate()) {
      await this.#requestCurrentPrice();
      await this.set("ethPriceLastUpdate", Date.now().toString());
    }
    return this.cachedPrice;
  }

  async #needsUpdate(): Promise<boolean> {
    const lastUpdate = await this.get("ethPriceLastUpdate");
    return Date.now() - Number(lastUpdate) > this.cachePeriod;
  }

  async #requestCurrentPrice(): Promise<void> {
    try {
      const { result } = await Moralis.EvmApi.token.getTokenPrice({
        chain: "0x1",
        address: WETH_CONTRACT,
      });
      await this.set("ethPrice", result.usdPrice.toString());
    } catch (e) {
      let message = "Failed to get ETH price";
      if (e instanceof Error) message += `, ${e.name}: ${e.message}`;
      throw new IAMError(message);
    }
  }
}

const ethPriceLoader = new EthPriceLoader();

export async function getEASFeeAmount(usdFeeAmount: number): Promise<BigNumber> {
  const ethPrice = await ethPriceLoader.getPrice();
  const ethFeeAmount = usdFeeAmount / ethPrice;
  return utils.parseEther(ethFeeAmount.toFixed(18));
}
