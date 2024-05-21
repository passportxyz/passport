import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class EnsPlatform extends Platform {
  platformId = "Ens";
  path = "Ens";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    heading:
      "The ENS stamp only recognizes ENS domains if they are set to your account as primary ENS (or reverse record).",
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-an-ens-account-to-passport",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
