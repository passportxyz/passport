import { AppContext, PlatformOptions, ProviderPayload } from "../types";
import { Platform, PlatformPreCheckError } from "../utils/platform";
import React from "react";
import { verifyCoinbaseAttestation } from "./Providers/coinbase";
import { Hyperlink } from "../utils/Hyperlink";

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
        <Hyperlink className="pl-1" href="https://www.coinbase.com/onchain-verify">
          Verify Coinbase ID
        </Hyperlink>{" "}
        on this wallet address <br />
        <br />
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

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const address = appContext.userDid.split(":")[4].toLowerCase();

    let hasAttestation = false;

    try {
      hasAttestation = await verifyCoinbaseAttestation(address);
    } catch (e) {
      console.error("Unable to complete Coinbase attestation pre-check", e);

      // There are occasional CORS issues which we can't identify the cause of
      // currently, so if this request fails just ignore it and do the standard
      // flow
      hasAttestation = true;
    }

    if (!hasAttestation) {
      throw new PlatformPreCheckError(
        "You need to verify your Coinbase ID onchain before you can verify your Coinbase account."
      );
    }

    return super.getProviderPayload(appContext);
  }

  async getOAuthUrl(state: string): Promise<string> {
    const coinbasebUrl = await Promise.resolve(
      `https://www.coinbase.com/oauth/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}`
    );
    return coinbasebUrl;
  }
}
