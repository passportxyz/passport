import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
import React from "react";

export class CoinbasePlatform extends Platform {
  platformId = "Coinbase";
  path = "coinbase";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    content: (
      <div>
        Obtain the Coinbase stamp by completing the following 2 steps to prove your Coinbase Verified ID and Coinbase
        account: <br />
        <br />
        Step 1:{" "}
        <a
          href="https://www.coinbase.com/onchain-verify"
          style={{
            color: "rgb(var(--color-foreground-2))",
            textDecoration: "underline",
            cursor: "pointer",
            paddingLeft: "2px",
          }}
          target="_blank"
          rel="noreferrer"
        >
          Verify Coinbase ID
        </a>{" "}
        on this wallet address <br />
        Step 2: Click Verify below to sign into your Coinbase account <br />
        You cannot complete without completing the Coinbase attestation onchain in Step 1. Ensure you have an active
        Coinbase account with a verified government ID to mint your onchain attestation for free on base.
      </div>
    ),
    cta: {
      label: "Support guide on adding Coinbase",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-coinbase-stamp-to-passport",
    },
  };

  constructor(options: PlatformOptions = {}) {
    super();
    this.clientId = options.clientId as string;
    this.redirectUri = options.redirectUri as string;
  }

  async getOAuthUrl(state: string): Promise<string> {
    const coinbasebUrl = await Promise.resolve(
      `https://www.coinbase.com/oauth/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}`
    );
    return coinbasebUrl;
  }
}
