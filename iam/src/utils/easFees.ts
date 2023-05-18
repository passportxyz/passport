import axios from "axios";
import { utils } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";

export async function getEASFeeAmount(usdAmount: number): Promise<BigNumber> {
  const ethUSD: {
    data: {
      ethereum: {
        usd: number;
      };
    };
  } = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=USD", {
    headers: {
      // TODO add API key
      Accept: "application/json",
    },
  });

  const ethAmount = usdAmount / ethUSD.data.ethereum.usd;
  return utils.parseEther(ethAmount.toFixed(18));
}
