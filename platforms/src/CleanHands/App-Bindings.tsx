/* eslint-disable */
import React from "react";
import { AppContext, ProviderPayload } from "../types.js";
import { Platform } from "../utils/platform.js";
import { Hyperlink } from "../utils/Hyperlink.js";

export class CleanHandsPlatform extends Platform {
  platformId = "CleanHands";
  path = "clean_hands";
  isEVM = true;
  banner = {
    heading: "Privately prove you are not sanctioned using Proof of Clean Hands",
    content: (
      <>
        To add the Clean Hands Stamp to your Passport...{" "}
        <Hyperlink href="">Learn more - TODO (link to new knowledge base article)</Hyperlink>
        <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
          <li>
            Have a smartphone and an Ethereum wallet with $5 in ETH (mainnet, OP, or Aurora), AVAX, or FTM for Clean
            Hands
          </li>
          <li>
            Go to{" "}
            <Hyperlink href="https://silksecure.net/holonym/diff-wallet/clean-hands/issuance/prereqs">
              Proof of Clean Hands
            </Hyperlink>
            , verify your Gov ID by connecting your wallet, and follow prompts to obtain the Clean Hands verification.
          </li>
          <li>After verification, mint the SBT to your wallet, then link it to your Passport by verifying it.</li>
        </ul>
        <br></br>
        Check the Sign attestation protocol to validate:
        <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
          <li>Default to checking all 3 chains</li>
          <li>End users will only be able to mint Passport on OP (out of Sui, Near & OP)</li>
        </ul>
      </>
    ),
    cta: {
      label: "Learn more",
      url: "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/connecting-snapshot-to-passport",
    },
  };

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const result = await Promise.resolve({});
    return result;
  }
}
