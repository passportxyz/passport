import React from "react";
import { PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getPhoneSBTByAddress } from "@holonym-foundation/human-id-sdk";

export class HumanIdPhonePlatform extends BaseHumanIDPlatform {
  platformName = "HumanIdPhone";
  platformId = "HumanIdPhone";
  path = "HumanIdPhone";
  credentialType = "phone" as const;
  sbtChecker = getPhoneSBTByAddress;

  constructor(options: PlatformOptions) {
    super(options);

    this.banner = {
      heading: "To add the Human ID Phone Stamp to your Passport...",
      content: React.createElement(
        "div",
        {},
        "Connect your wallet and verify your phone number privately through Human ID"
      ),
      cta: {
        label: "Learn more",
        url: "https://human-id.org",
      },
    };
  }
}
