import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class NFTPlatform extends Platform {
  platformId = "NFT";
  path = "NFT";
  isEVM = true;

  banner = {
    content:
      "Click verify to process your Ethereum Mainnet NFTs. Passport uses a constantly evolving model to review your NFT activity and compare against known Sybil behavior. The number of points you'll receive is based on many factors related to the overall NFT portfolio of the address.",
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/how-do-i-add-passport-stamps/nft-stamp",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
