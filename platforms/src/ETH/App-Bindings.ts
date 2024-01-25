import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
export class ETHPlatform extends Platform {
  platformId = "ETH";
  path = "ETH";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    heading: `
      Click verify to process your Ethereum L1 transactions. Gitcoin uses a constantly
      evolving model to review your transaction history and compare against known Sybil
      behavior. The number of points you'll receive based on many factors related to the
      overall activity of the address.
    `,
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
