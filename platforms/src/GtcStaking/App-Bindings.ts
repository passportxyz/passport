/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class GTCStakingPlatform implements Platform {
  platformId = "GtcStaking";
  path = "GtcStaking";
  isEVM = true;
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    heading:
      "You can connect your wallet to verify your staked GTC amount. Using Identity staking your GTC will be locked for up to 90 days and then can be un-staked or re-staked at that time. If you haven't staked yet, you can follow this link to do so.",
    cta: {
      label: "Go to Identity Staking",
      url: "https://www.staking.passport.gitcoin.co/",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
