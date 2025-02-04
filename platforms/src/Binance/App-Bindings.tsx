import { Hyperlink } from "../utils/Hyperlink.js";
import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
import React from "react";

export class BinancePlatform extends Platform {
  platformId = "Binance";
  path = "binance";
  isEVM = true;

  banner = {
    content: (
      <div>
        <Hyperlink href="https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-binance-stamp-to-passport">
          Binance Stamp Guide
        </Hyperlink>
        <br />
        <br />
        Obtain your Binance Stamp by completing the following steps:
        <br />
        <br />
        <strong>Step 1:</strong> Obtain your <Hyperlink href="https://www.binance.com/en/babt">Binance Account Bound Token (BABT)</Hyperlink> using the same address that you&apos;re currently using with this Passport.
        <br />
        <br />
        <strong>Step 2:</strong> Click &quot;Verify&quot; below for the Stamp to check that BABT is owned by this wallet address.
        <br />
        <br />
        This will prove you&apos;ve completed the Government ID verification process (KYC) on Binance.
        <br />
        <br />
        Important considerations:
        <ul>
          <li>You <em>must</em> attach the Binance Account Bound Token (BABT) to the same address that you are using with this Passport.</li>
          <li>If you attached your BABT to your Binance wallet and aren&apos;t using that wallet with Passport, you will not be able to verify this Stamp.</li>
        </ul>
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
