import { Platform } from "../utils/platform";
import { AppContext, ProviderPayload } from "../types";

export class UberPlatform extends Platform {
  platformId = "Uber";
  path = "uber";

  getRequestUrl(state: string, callbackUrl?: string): string {
    return `http://localhost:3004/integration?state=${state}&redirect_uri=${callbackUrl}`;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const reqUrl: string = this.getRequestUrl(appContext.state, appContext.callbackUrl);
    const width = 600;
    const height = 800;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;

    // Pass data to the page via props
    appContext.window.open(
      reqUrl,
      "_blank",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    return appContext.waitForRedirect(this).then((data) => {
      return {
        code: data.code,
        sessionKey: data.state,
        signature: data.signature,
      };
    });
  }
}
