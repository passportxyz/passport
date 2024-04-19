import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
export class ZkSyncPlatform extends Platform {
  platformId = "ZkSync";
  path = "ZkSync";
  isEVM = true;

  banner = {
    content:
      "Click verify to process your zkSync Era transactions. Passport uses a constantly evolving model to review your transaction history and compare against known Sybil behavior. The number of points you'll receive is based on many factors related to the overall activity of the address.",
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/how-do-i-add-passport-stamps/zksync-stamp",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
