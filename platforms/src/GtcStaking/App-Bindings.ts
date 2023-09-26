/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class GTCStakingPlatform implements Platform {
  platformId = "GtcStaking";
  path = "GtcStaking";
  isEVM = true;
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    content: "If you haven't staked yet, you can do so now.",
    cta: {
      label: "Identity Staking",
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
