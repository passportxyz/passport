import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class IDriss extends Platform {
  platformId = "IDriss";
  path = "IDriss";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    heading: "The IDriss stamp recognizes ownership of the IDriss Membership NFT.",
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
