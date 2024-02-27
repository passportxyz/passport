import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class LensPlatform extends Platform {
  platformId = "Lens";
  path = "Lens";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  banner = {
    content: `To add the Lens Stamp to your Gitcoin Passport, ensure you're using
    your Lens Handle, not your profile. A Lens Handle is your unique identifier on
    Lens, required for verification. Obtain a Handle either through the Lens beta or
    by purchasing one from NFT marketplaces. Note: Verification may be delayed after
    claiming your Handle.`,
    cta: {
      label: "Learn more",
      url: "https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/how-do-i-add-passport-stamps/guide-to-add-lens-stamp-to-gitcoin-passport",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
