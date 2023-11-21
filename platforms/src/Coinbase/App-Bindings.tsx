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
    content: (
      <div>
        This stamp verifies that you have a Coinbase account and that you have completed the{" "}
        <Link href="https://help.coinbase.com/en/coinbase/getting-started/getting-started-with-coinbase/id-doc-verification">
          Coinbase Onchain Verification
        </Link>{" "}
        process. In order to qualify for this stamp, you must complete the Coinbase Oauth process. Once authenticated we
        will query the{" "}
        <Link href="https://base.easscan.org/schema/view/0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9">
          Ethereum Attestation Service
        </Link>{" "}
        to verify that you have a valid Verified Account attestation for the connected account. Note, Coinbase allows
        you to verify up to three accounts, but we will only issue points for a single address.
      </div>
    ),
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
