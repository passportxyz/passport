/* eslint-disable */
import React from "react";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getCleanHandsSPAttestationByAddress } from "@holonym-foundation/human-id-sdk";
import { CLEAN_HANDS_CREDENTIAL_TYPE } from "./constants.js";
import { Hyperlink } from "../utils/Hyperlink.js";

export class CleanHandsPlatform extends BaseHumanIDPlatform {
  platformId = "CleanHands";
  path = "CleanHands";
  credentialType = CLEAN_HANDS_CREDENTIAL_TYPE;
  attestationFetcher = getCleanHandsSPAttestationByAddress; // Note: attestation, not SBT

  banner = {
    content: (
      <div>
        <Hyperlink href="https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-proof-of-clean-hands-stamp">
          Clean Hands Stamp Guide
        </Hyperlink>
        <br />
        <br />
        To add the Clean Hands Stamp to your Passport:
        <br />
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
        <br />
        <br />
        Check the Sign attestation protocol to validate:
        <br />
        <ul style={{ listStyleType: "disc", paddingLeft: "20px" }}>
          <li>Default to checking all 3 chains</li>
          <li>End users will only be able to mint Passport on OP (out of Sui, Near & OP)</li>
        </ul>
      </div>
    ),
  };
}
