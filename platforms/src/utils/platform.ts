import { AppContext, ProviderPayload } from "../types";

export type PlatformOptions = {
  platformId: string;
  path: string;
  clientId?: string;
  redirectUri?: string;
  state?: string;
};

export class Platform {
  platformId: string;
  path: string;
  clientId?: string;
  redirectUri?: string;
  state?: string;
  bannerContent?: string;

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
      `toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    return appContext.waitForRedirect().then((data) => {
      return {
        code: data.code,
        sessionKey: data.state,
        signature: data.signature,
      };
    });
  }

  getOAuthUrl(state?: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
