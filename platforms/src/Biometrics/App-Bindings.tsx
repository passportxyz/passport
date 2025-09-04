import React from "react";
import { PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getBiometricsSBTByAddress } from "@holonym-foundation/human-id-sdk";
import { BIOMETRICS_CREDENTIAL_TYPE } from "./constants.js";

export class BiometricsPlatform extends BaseHumanIDPlatform {
  platformId = "Biometrics";
  path = "Biometrics";
  credentialType = BIOMETRICS_CREDENTIAL_TYPE;
  sbtFetcher = getBiometricsSBTByAddress;

  banner = {
    content: (
      <p>
        Click the button above to complete biometric verification on Human ID. You'll need a front-facing camera to
        complete 3D facial liveness detection. After completing verification there, return here and verify your stamp.
      </p>
    ),
    cta: {
      label: "Complete verification on Human ID",
      url: "https://silksecure.net/holonym/diff-wallet/biometrics",
    },
  };
}
