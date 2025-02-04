/* eslint-disable */
import { AppContext, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";

export class SnapshotPlatform extends Platform {
  platformId = "Snapshot";
  path = "Snapshot";
  isEVM = true;
  banner = {
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-snapshot-to-passport",
    },
  };
  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
