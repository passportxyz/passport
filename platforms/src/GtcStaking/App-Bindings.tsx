/* eslint-disable */
import React from "react";
import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
import { Hyperlink } from "../utils/Hyperlink";

export class GTCStakingPlatform extends Platform {
  platformId = "GtcStaking";
  path = "GtcStaking";
  isEVM = true;
  clientId: string = null;

  constructor(options: PlatformOptions = {}) {
    super();
    this.state = options.state as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  banner = {
    content: (
      <div>
        If you haven't staked yet, you can do so now.
        <Hyperlink
          href="https://support.passport.xyz/passport-knowledge-base/gtc-staking/identity-staking-questions"
          className="pl-1"
        >
          Learn more
        </Hyperlink>
      </div>
    ),
    cta: {
      label: "Identity Staking",
      url: "https://www.staking.passport.gitcoin.co/",
    },
  };
}
