import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class CivicPlatform extends Platform {
  platformId = "Civic";
  path = "Civic";
  isEVM = true;

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }

  banner = {
    heading: "Click on 'Get Civic Pass' to visit Civic and issue your passes.",
    content:
      "Once you have one or more Civic Passes, select them above and click 'Verify'. Note: Polygon is recommended for the lowest gas cost.",
    cta: {
      label: "Get Civic Pass",
      url: "https://getpass.civic.com?scope=uniqueness,captcha,liveness&chain=polygon,arbitrum%20one,xdc,ethereum",
    },
  };
}
