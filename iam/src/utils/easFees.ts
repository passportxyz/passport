import axios from "axios";
import { utils } from "ethers";

export async function getEASFeeAmount(usdAmount: number): Promise<string> {
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
  return utils.hexZeroPad(utils.parseEther(ethAmount.toString()).toHexString(), 32);
}
