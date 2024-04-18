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
        Secure the Coinbase Stamp by completing a Coinbase attestation onchain. Ensure you have an active Coinbase
        account with a verified government ID to mint your onchain attestation, elevating your Passport&apos;s
        credibility and trust.{" "}
        <a
          href="https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/how-do-i-add-passport-stamps/guide-to-add-coinbase-stamp-to-passport"
          style={{
            color: "rgb(var(--color-foreground-2))",
            textDecoration: "underline",
            cursor: "pointer",
            paddingLeft: "2px",
          }}
          target="_blank"
          rel="noreferrer"
        >
          Learn more
        </a>
        .
      </div>
    ),
    cta: {
      label: "Begin Your Onchain Verification Journey with Coinbase",
      url: "https://www.coinbase.com/onchain-verify",
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
