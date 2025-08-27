import React from "react";
import { PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getPhoneSBTByAddress, HubV3SBT } from "@holonym-foundation/human-id-sdk";

export class HumanIdPhonePlatform extends BaseHumanIDPlatform {
  platformName = "HumanIdPhone";
  platformId = "HumanIdPhone";
  path = "HumanIdPhone";
  credentialType = "phone" as const;

  sbtChecker = async (address: string): Promise<boolean> => {
    let sbt: HubV3SBT | null = null;
    try {
      sbt = await getPhoneSBTByAddress(address as `0x${string}`);
    } catch {
      /* Throws an error if the address is not found */
    }

    if (sbt && typeof sbt === "object" && "expiry" in sbt) {
      // Check if SBT is not expired
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (sbt.expiry > currentTime && !sbt.revoked) {
        return true;
      }
    }

    return false;
  };

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
        url: "https://human.tech",
      },
    };
  }
}
