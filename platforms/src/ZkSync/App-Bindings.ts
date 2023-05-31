import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
export class ZkSyncPlatform extends Platform {
  platformId = "ZkSync";
  path = "ZkSync";
  isEVM = true;

  banner = {
    heading:
      'We currently only recognize finalized "TRANSFER" type transactions on ZkSync 1.0. This means that other transactions like MintNFT, Swap etc aren\'t recognized.',
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
