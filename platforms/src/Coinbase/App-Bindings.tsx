import { PlatformOptions } from "../types";
import { Platform } from "../utils/platform";
import React from "react";

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" className="text-color-1 cursor-pointer underline" rel="noreferrer">
    {children}
  </a>
);

export class CoinbasePlatform extends Platform {
  platformId = "Coinbase";
  path = "coinbase";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    content: `Integrate your Coinbase account with your onchain identity to unlock a realm of
      digital possibilities. This stamp requires you to have an active Coinbase account
      and to establish your onchain identity on Base, bridging the gap between
      traditional and decentralized finance.`.replace(/\s+/gm, " "),
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
