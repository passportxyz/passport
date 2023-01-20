import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GnosisSafePlatform extends Platform {
  platformId = "GnosisSafe";
  path = "GnosisSafe";
  isEVM = true;

  banner = {
    heading:
      "Currently, we only recognize Gnosis Safes on the Ethereum main network. So you can't get that stamp through your Gnosis Safes on other networks.",
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
