import React from "react";
import { Platform } from "../utils/platform.js";
import { AppContext, ProviderPayload } from "../types.js";

export class BiometricsPlatform extends Platform {
  platformId = "Biometrics";
  path = "Biometrics";
  isEVM = true;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

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
