import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";

export class HumanodeOAuth2ServicePlatform extends Platform {
  path = "HumanodeOAuth2Service";
  platformId = "HumanodeOAuth2Service";

  clientId: string = null;
  redirectUri: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    return await Promise.resolve(
      `${process.env.NEXT_PUBLIC_PASSPORT_HUMANODE_OAUTH2_SERVICE_AUTH_URL}/oauth2/auth?client_id=${
        process.env.NEXT_PUBLIC_PASSPORT_HUMANODE_OAUTH2_SERVICE_CLIENT_ID
      }&response_type=code&redirect_uri=${encodeURIComponent(
        process.env.NEXT_PUBLIC_PASSPORT_HUMANODE_OAUTH2_SERVICE_CALLBACK
      )}&scope=openid&state=${state}`
    );
  }
}
