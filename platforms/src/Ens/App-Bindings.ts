import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class EnsPlatform extends Platform {
  platformId = "Ens";
  path = "Ens";
  clientId: string = null;
  redirectUri: string = null;

  bannerContent =
    "The ENS stamp only recognizes ENS domains if they are set to your account as primary ENS (or reverse record).";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
