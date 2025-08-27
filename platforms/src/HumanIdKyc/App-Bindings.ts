import React from "react";
import { PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getKycSBTByAddress, HubV3SBT } from "@holonym-foundation/human-id-sdk";

export class HumanIdKycPlatform extends BaseHumanIDPlatform {
  platformName = "HumanIdKyc";
  platformId = "HumanIdKyc";
  path = "HumanIdKyc";
  credentialType = "kyc" as const;

  sbtChecker = async (address: string): Promise<boolean> => {
    let sbt: HubV3SBT | null = null;
    try {
      sbt = await getKycSBTByAddress(address as `0x${string}`);
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
      heading: "To add the Human ID KYC Stamp to your Passport...",
      content: React.createElement(
        "div",
        {},
        "Connect your wallet and complete identity verification privately through Human ID"
      ),
      cta: {
        label: "Learn more",
        url: "https://human.tech",
      },
    };
  }
}
