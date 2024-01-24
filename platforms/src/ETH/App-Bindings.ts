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
      Ethereum Activity: A nuanced, adaptive measure of your authentic involvement, shaping trust in the Ethereum ecosystem.
    `,
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
