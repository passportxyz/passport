/* eslint-disable */
import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GnosisSafePlatform extends Platform {
  platformId = "GnosisSafe";
  path = "GnosisSafe";

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }
}
