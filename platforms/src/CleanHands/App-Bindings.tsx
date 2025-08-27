/* eslint-disable */
import React from "react";
import { AppContext, ProviderPayload, PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { Platform } from "../utils/platform.js";
import { Hyperlink } from "../utils/Hyperlink.js";
import { getCleanHandsSPAttestationByAddress } from "@holonym-foundation/human-id-sdk";

export class CleanHandsPlatform extends BaseHumanIDPlatform {
  platformName = "CleanHands";
  platformId = "CleanHands";
  path = "clean_hands";
  credentialType = "clean-hands" as const;

  sbtChecker = async (address: string): Promise<boolean> => {
    try {
      const attestation = await getCleanHandsSPAttestationByAddress(address as `0x${string}`);
      return !!attestation;
    } catch {
      /* Throws an error if the address is not found or if the attestation is in any way invalid */
      return false;
    }
  };

  constructor(options: PlatformOptions) {
    super(options);

    this.banner = {
      heading: "To add the Human ID Clean Hands Stamp to your Passport...",
      content: React.createElement(
        "div",
        {},
        "Connect your wallet and verify your clean hands status privately through Human ID"
      ),
      cta: {
        label: "Learn more",
        url: "https://human.tech",
      },
    };
  }
}
