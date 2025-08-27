import React from "react";
import { PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getBiometricsSBTByAddress, HubV3SBT } from "@holonym-foundation/human-id-sdk";

export class BiometricsPlatform extends BaseHumanIDPlatform {
  platformName = "Biometrics";
  platformId = "Biometrics";
  path = "Biometrics";
  credentialType = "biometrics" as const;

  sbtChecker = async (address: string): Promise<boolean> => {
    let sbt: HubV3SBT | null = null;
    try {
      sbt = await getBiometricsSBTByAddress(address as `0x${string}`);
    } catch {
      /* Throws an error if the address is not found */
    }

    if (sbt) {
      // Check if SBT is not expired
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (sbt.expiry > currentTime && !sbt.revoked && sbt.publicValues.length > 0) {
        return true;
      }
    }

    return false;
  };

  constructor(options: PlatformOptions) {
    super(options);

    this.banner = {
      heading: "To add the Human ID Biometrics Stamp to your Passport...",
      content: React.createElement(
        "div",
        {},
        "Connect your wallet and verify your biometrics privately through Human ID"
      ),
      cta: {
        label: "Learn more",
        url: "https://human.tech",
      },
    };
  }
}
