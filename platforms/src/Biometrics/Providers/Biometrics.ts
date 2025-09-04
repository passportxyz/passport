import { BaseHumanIdProvider } from "../../HumanID/shared/BaseHumanIdProvider.js";
import { getBiometricsSBTByAddress } from "@holonym-foundation/human-id-sdk";
import { BIOMETRICS_CREDENTIAL_TYPE } from "../constants.js";

export class BiometricsProvider extends BaseHumanIdProvider {
  type = "Biometrics";
  credentialType = BIOMETRICS_CREDENTIAL_TYPE;
  sbtFetcher = getBiometricsSBTByAddress;

  // Inherits all validation logic from BaseHumanIdProvider
}
