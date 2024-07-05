import { Hyperlink } from "../utils/Hyperlink";
import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";
import React from "react";

export class BinancePlatform extends Platform {
  platformId = "Binance";
  path = "binance";
  isEVM = true;

  banner = {
    content: (
      <div>
        Obtain your <Hyperlink href="https://www.binance.com/en/babt">Binance Account Bound Token (BABT)</Hyperlink> by
        verifying your identity and logging into your Binance account. This will prove you're verified by Binance and
        have completed the KYC process.
      </div>
    ),
  };

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getProviderPayload(_appContext: AppContext): Promise<ProviderPayload> {
    return await Promise.resolve({});
  }
}
