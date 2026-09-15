import React from "react";
import { PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getPhoneSBTByAddress } from "@holonym-foundation/human-id-sdk";
import { PHONE_CREDENTIAL_TYPE } from "./constants.js";

export class HumanIdPhonePlatform extends BaseHumanIDPlatform {
  platformId = "HumanIdPhone";
  path = "HumanIdPhone";
  credentialType = PHONE_CREDENTIAL_TYPE;
  sbtFetcher = getPhoneSBTByAddress;

  constructor(options: PlatformOptions) {
    super(options);

    // Temporary: phone verification is disabled while migrating from Messente
    // to Twilio Verify. Restore the original banner once Twilio is live.
    // See holonym-foundation/internal-docs#2990
    this.banner = {
      heading: "Phone verification is temporarily unavailable",
      content: React.createElement(
        "div",
        {},
        "We're upgrading our phone verification provider. This stamp will be back shortly — check back soon."
      ),
      cta: {
        label: "Learn more",
        url: "https://human.tech",
      },
    };
  }
}
