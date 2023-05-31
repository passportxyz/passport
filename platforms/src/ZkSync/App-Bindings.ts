import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
export class ZkSyncPlatform extends Platform {
  platformId = "ZkSync";
  path = "ZkSync";
  isEVM = true;

  banner = {
    heading:
      "Currently, only  We look for a transaction with a finalized status and an op.from field that matches the your address.",
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
