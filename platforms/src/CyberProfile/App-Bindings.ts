import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class CyberConnectPlatform extends Platform {
  platformId = "CyberConnect";
  path = "CyberConnect";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    content:
      "Only CyberProfiles created using the legacy CyberConnect contracts on BSC are currently supported. We are working with CyberConnect to resolve this.",
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
