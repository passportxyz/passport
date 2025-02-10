/* eslint-disable */
import React from "react";
import { AppContext, Platform, ProviderPayload } from "../types";
import { Hyperlink } from "../utils/Hyperlink";

export class HolonymPlatform implements Platform {
  platformId = "Holonym";
  path = "Holonym";
  isEVM = true;

  banner = {
    heading: "To add the Holonym Stamp to your Passport...",
    content: (
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          Have a smartphone, valid ID, and an Ethereum wallet with $0 (ePassport) or $0-$5 in ETH (mainnet, OP, or
          Aurora), AVAX, or FTM for Government ID Verification.
        </li>
        <li>
          Go to <Hyperlink href="https://silksecure.net/holonym/diff-wallet">Holonym's page</Hyperlink>, verify your ID
          by connecting your wallet, and follow prompts to obtain the Government ID or ePassport Proof.
        </li>
        <li>After verification, mint the SBT to your wallet, then link it to your Passport by verifying it.</li>
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
