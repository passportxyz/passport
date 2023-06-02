import { AppContext, AuthInfo, ProviderPayload } from "../types";

export type PlatformOptions = {
  platformId: string;
  path: string;
  clientId?: string;
  redirectUri?: string;
  state?: string;
};

export type PlatformBanner = {
  heading?: string;
  content?: string;
  cta?: {
    label: string;
    url: string;
  };
};

export class Platform {
  platformId: string;
  path: string;
  clientId?: string;
  redirectUri?: string;
  state?: string;
  banner?: PlatformBanner;
  isEVM?: boolean;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    console.log("!!!!!");
    const { authUrl, cacheToken } = await this.getAuthInfo(appContext.state);
    console.log("authUrl", authUrl);
    console.log("cacheToken", cacheToken);
    const width = 600;
    const height = 800;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;

    // Pass data to the page via props
    appContext.window.open(
      authUrl,
      "_blank",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    console.log("about to wait for redirect");
    return appContext.waitForRedirect().then((data) => {
      console.log("then");
      return {
        code: data.code,
        sessionKey: data.state,
        signature: data.signature,
        cacheToken,
      };
    });
  }

  getAuthInfo(state?: string): Promise<AuthInfo> {
    throw new Error("Method not implemented.");
  }
}
