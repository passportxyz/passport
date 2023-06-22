import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
export class ZkSyncPlatform extends Platform {
  platformId = "ZkSync";
  path = "ZkSync";
  isEVM = true;

  banner = {
    heading:
      "Only 'TRANSFER' transactions on zkSync 1.0 are recognized. Transactions need to achieve verified status (may take up to 24hrs) across all zkSync networks to count. Other transaction types are not currently included.",
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
