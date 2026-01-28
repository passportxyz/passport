import { PlatformOptions, AppContext, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";

export class SteamPlatform extends Platform {
  platformId = "Steam";
  path = "steam";
  redirectUri: string = null;
  realm: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.redirectUri = options.redirectUri as string;
    this.realm = options.realm as string;
    this.banner = {
      cta: {
        label: "Learn more",
        url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-steam-stamp",
      },
    };
  }

  async getOAuthUrl(state: string): Promise<string> {
    const params = new URLSearchParams({
      "openid.ns": "http://specs.openid.net/auth/2.0",
      "openid.mode": "checkid_setup",
      "openid.return_to": `${this.redirectUri}?state=${state}`,
      "openid.realm": this.realm,
      "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
      "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
    });

    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const authUrl: string = await this.getOAuthUrl(appContext.state);
    const width = 600;
    const height = 800;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;

    // Open Steam OpenID login
    appContext.window.open(
      authUrl,
      "_blank",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    // Wait for OpenID redirect response
    return appContext.waitForRedirect(this).then((data) => {
      // Steam OpenID returns claimed_id in the response
      // The frontend callback handler extracts openid.claimed_id and passes it as 'code'
      return {
        code: data.code || "",
        sessionKey: data.state,
        signature: data.signature,
      };
    });
  }
}
