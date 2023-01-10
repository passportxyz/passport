import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class NFTPlatform extends Platform {
  platformId = "NFT";
  path = "NFT";
  isEVM = true;

  bannerContent =
    "Currently, we only recognize NFTs on the Ethereum main network. So you can't get that stamp through your NFTs on other networks.";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
