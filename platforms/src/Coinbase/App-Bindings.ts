import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
export class CoinbasePlatform extends Platform {
  platformId = "Coinbase";
  path = "coinbase";
  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const coinbasebUrl = await Promise.resolve(
      `https://www.coinbase.com/oauth/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}`
    );
    return coinbasebUrl;
  }
}
