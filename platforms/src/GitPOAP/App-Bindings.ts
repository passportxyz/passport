import { AppContext, Platform, ProviderPayload } from "../types";

export class GitPOAPPlatform implements Platform {
  platformId = "GitPOAP";
  path = "GitPOAP";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
