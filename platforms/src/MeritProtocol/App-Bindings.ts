import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
export class MeritProtocolPlatform extends Platform {
  platformId = "MeritProtocol";
  path = "MeritProtocol";

  bannerContent = "This Stamp supports income verifiaction for most United States residents.";

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.state = options.state as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const meritUrl = await Promise.resolve(
      process.env.MERIT_HOST_URL +
        `/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}&scope=income`
    );
    return meritUrl;
  }
}
