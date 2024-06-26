import { parseEther } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import Moralis from "moralis";
import { PassportCache } from "@gitcoin/passport-platforms";

const FIVE_MINUTES = 1000 * 60 * 5;
const WETH_CONTRACT = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

class EthPriceLoader {
  cachePeriod = FIVE_MINUTES;
  cache: PassportCache = new PassportCache();

  async init(): Promise<void> {
    await this.cache.init();
  }

  async getPrice(): Promise<number> {
    if ((await this.#needsUpdate()) || (await this.cache.get("ethPrice")) === null) {
      await this.#requestCurrentPrice();
    }
    // We read the number that we return from the cache again
    // This might seem redundant in the case that 'this.#requestCurrentPrice()' might have just re-fetched price from Moralis
    // but it also serves as a fallback in case price-fetching failed, and we continue to use (the somewhat outdate price)
    // from our cache
    return Number(await this.cache.get("ethPrice"));
  }

  async #needsUpdate(): Promise<boolean> {
    const lastUpdate = await this.cache.get("ethPriceLastUpdate");
    const lastUpdateTimestamp = Date.now() - Number(lastUpdate || Date.now());
    return lastUpdateTimestamp > this.cachePeriod;
  }

  async #requestCurrentPrice(): Promise<void> {
    try {
      const { result } = await Moralis.EvmApi.token.getTokenPrice({
        chain: "0x1",
        address: WETH_CONTRACT,
      });

      try {
        await this.cache.set("ethPrice", result.usdPrice.toString());
        await this.cache.set("ethPriceLastUpdate", Date.now().toString());
      } catch (e) {
        let message = "Failed to cache ETH price";
        if (e instanceof Error) message += `, ${e.name}: ${e.message}`;
        console.error(`REDIS CONNECTION ERROR: ${message}`);
      }
    } catch (e) {
      let message = "Failed to get ETH price";
      if (e instanceof Error) message += `, ${e.name}: ${e.message}`;
      console.error(`MORALIS ERROR: ${message}`);
    }
  }
}

const ethPriceLoader = new EthPriceLoader();

export async function getEASFeeAmount(usdFeeAmount: number): Promise<bigint> {
  await ethPriceLoader.init();
  const ethPrice = await ethPriceLoader.getPrice();
  const ethFeeAmount = usdFeeAmount / ethPrice;
  return parseEther(ethFeeAmount.toFixed(18));
}
