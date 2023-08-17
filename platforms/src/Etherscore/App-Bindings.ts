import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class EtherscorePlatform extends Platform {
  platformId = "Etherscore";
  path = "Etherscore";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    heading:
      "Etherscore helps blockchain users build their on-chain reputation by claiming badges. If you haven't claimed one yet, connect to the Etherscore dapp and check your eligibility.",
    cta: {
      label: "Start now",
      url: "https://alpha.etherscore.network/",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
