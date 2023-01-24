/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class GTCStakingPlatform implements Platform {
  platformId = "GtcStaking";
  path = "";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    heading:
      "During a live Gitcoin Grants Round, you can connect your wallet to verify your staked GTC amount. If you haven't staked yet, you can follow this link to do so.",
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
