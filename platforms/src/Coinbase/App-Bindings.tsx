import { AppContext, PlatformOptions, ProviderPayload } from "../types.js";
import { Platform, PlatformPreCheckError } from "../utils/platform.js";
import React from "react";
import { verifyCoinbaseAttestation } from "./Providers/coinbase.js";
import { Hyperlink } from "../utils/Hyperlink.js";

export class CoinbasePlatform extends Platform {
  platformId = "Coinbase";
  path = "coinbase";
  clientId: string = null;
  redirectUri: string = null;

  banner = {
    content: (
      <div>
        <Hyperlink href="https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-coinbase-stamp-to-passport">
          Coinbase Stamp Guide
        </Hyperlink>
        <br />
        <br />
        Obtain the Coinbase Stamp by completing the following 2 steps to prove your Coinbase Verified ID and Coinbase
        account:
        <br />
        <br />
        <strong>Step 1:</strong>{" "}
        <Hyperlink href="https://www.coinbase.com/onchain-verify">Verify your Coinbase ID</Hyperlink> with the same
        address that you&apos;re currently using with this Passport.
        <br />
        <br />
        <strong>Step 2:</strong> Click &quot;Verify&quot; below to sign into your Coinbase account.
        <br />
        <br />
        Important considerations:
        <ul>
          <li>
            You <em>must</em> complete both steps to verify this Stamp.
          </li>
          <li>
            You <em>must</em> have an active Coinbase account with a verified government ID to mint your onchain
            attestation for free on Base.
          </li>
        </ul>
      </div>
    ),
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
    const coinbaseUrl = await Promise.resolve(
      `https://login.coinbase.com/oauth2/auth?response_type=code&client_id=${this.clientId}&redirect_uri=${this.redirectUri}&state=${state}`
    );
    return coinbaseUrl;
  }
}
