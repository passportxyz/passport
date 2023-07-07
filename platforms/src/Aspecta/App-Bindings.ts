//App-bindings.ts - OAuth
import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
export class AspectaPlatform extends Platform {
  platformId = "Aspecta";
  path = "Aspecta";

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.state = options.state as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const AspectaUrl = await Promise.resolve(
      `https://oauth2.aspecta.id/auth?grant_type=authorization_code&response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=user&state=${state}`
    );
    return AspectaUrl;
  }
}
