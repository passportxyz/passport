/* eslint-disable */
import { AccessTokenResult, AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";
export class LinkedinPlatform implements Platform {
  platformId = "Linkedin";
  path = "linkedin";
  clientId: string = null;
  redirectUri: string = null;
  state: string = null;

  constructor(options: PlatformOptions = {}) {
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
    this.state = options.state as string;
  }

  getProviderProof?(): Promise<AccessTokenResult> {
    throw new Error("Method not implemented.");
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const authUrl: string = await this.getOAuthUrl(appContext.state);
    const width = 600;
    const height = 800;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;

    // Pass data to the page via props
    appContext.window.open(
      authUrl,
      "_blank",
      "toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=" +
        width +
        ", height=" +
        height +
        ", top=" +
        top +
        ", left=" +
        left
    );

    return appContext.waitForRedirect();
  }

  async getOAuthUrl(state: string): Promise<string> {
    const linkedinUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}&scope=r_emailaddress%20r_liteprofile`;
    return linkedinUrl;
  }
}
