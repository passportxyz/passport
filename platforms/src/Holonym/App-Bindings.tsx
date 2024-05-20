/* eslint-disable */
import React from "react";
import { AppContext, Platform, ProviderPayload } from "../types";

export class HolonymPlatform implements Platform {
  platformId = "Holonym";
  path = "Holonym";

  banner = {
    heading: "To add the Holonym Stamp to your Gitcoin Passport...",
    content: (
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>Have a smartphone, valid ID, and an Ethereum wallet with ~$10 in ETH or AVAX.</li>
        <li>
          Go to Holonym's page, verify your ID by connecting your wallet, pay the verification fee, and follow prompts
          to take ID and selfie photos.
        </li>
        <li>After verification, mint the SBT to your wallet, then link it to your Gitcoin Passport by verifying it.</li>
      </ul>
    ),
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/guide-to-add-holonym-stamp-to-gitcoin-passport",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
