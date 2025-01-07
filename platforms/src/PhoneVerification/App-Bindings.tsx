/* eslint-disable */
import React from "react";
import { AppContext, Platform, ProviderPayload } from "../types";
import { Hyperlink } from "../utils/Hyperlink";

export class PhoneVerificationPlatform implements Platform {
  platformId = "PhoneVerification";
  path = "PhoneVerification";
  isEVM = true;

  banner = {
    heading: "To add the Phone Verification Stamp to your Passport...",
    content: (
      <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
        <li>
          Have a smartphone and an Ethereum wallet with $5 in ETH (mainnet, OP, or Aurora), AVAX, or FTM for Phone
          Verification.
        </li>
        <li>
          Go to <Hyperlink href="https://silksecure.net/holonym/diff-wallet/phone">Zeronym by Holonym</Hyperlink>,
          verify your phone number, and follow prompts to complete the Phone Proof.
        </li>
        <li>After verification, mint the SBT to your wallet, then link it to your Passport by verifying it.</li>
      </ul>
    ),
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-zeronym-stamp",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
