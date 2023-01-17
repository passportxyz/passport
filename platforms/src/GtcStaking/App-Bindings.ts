/* eslint-disable */
import { AppContext, Platform, PlatformOptions, ProviderPayload } from "../types";

export class GTCStakingPlatform implements Platform {
  platformId = "GtcStaking";
  path = "";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    heading: "Stake your GTC on the new Identity Staking site.",
    content: "Defend against sybil by staking on your own identity or somebody else's. By staking, the profile of stamps in the Passport becomes more unique.",
    cta: {
      label: "Go to Identity Staking",
      url: "https://www.staking.passport.gitcoin.co/"
    }
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
