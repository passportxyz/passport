import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class GnosisSafePlatform extends Platform {
  platformId = "GnosisSafe";
  path = "GnosisSafe";
  isEVM = true;

  banner = {
    heading:
      "Currently, we only recognize Gnosis Safes on the Ethereum main network. So you can't get that stamp through your Gnosis Safes on other networks.",
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/gnosis-safe-stamp",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
