import React from "react";
import { PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getKycSBTByAddress } from "@holonym-foundation/human-id-sdk";

export class HumanIdKycPlatform extends BaseHumanIDPlatform {
  platformName = "HumanIdKyc";
  platformId = "HumanIdKyc";
  path = "HumanIdKyc";
  credentialType = "kyc" as const;
  sbtChecker = getKycSBTByAddress;

  constructor(options: PlatformOptions) {
    super(options);

    this.banner = {
      heading: "To add the Human ID KYC Stamp to your Passport...",
      content: React.createElement(
        "div",
        {},
        "Connect your wallet and complete identity verification privately through Human ID"
      ),
      cta: {
        label: "Learn more",
        url: "https://human-id.org",
      },
    };
  }
}
