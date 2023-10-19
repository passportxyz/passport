import { utils } from "ethers";
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
      await this.cache.set("ethPrice", result.usdPrice.toString());
      await this.cache.set("ethPriceLastUpdate", Date.now().toString());
    } catch (e) {
      let message = "Failed to get ETH price";
      if (e instanceof Error) message += `, ${e.name}: ${e.message}`;
      console.error(`REDIS CONNECTION ERROR: ${message}`);
    }
  }
}

const ethPriceLoader = new EthPriceLoader();

export async function getEASFeeAmount(usdFeeAmount: number): Promise<BigNumber> {
  await ethPriceLoader.init();
  const ethPrice = await ethPriceLoader.getPrice();
  const ethFeeAmount = usdFeeAmount / ethPrice;
  return utils.parseEther(ethFeeAmount.toFixed(18));
}
