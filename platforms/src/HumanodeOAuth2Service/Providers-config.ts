import { PlatformSpec, PlatformGroupSpec } from "../types";

export const HumanodeOAuth2ServicePlatformDetails: PlatformSpec = {
  platform: "HumanodeOAuth2Service",
  name: "BiometricsLivenessCheck",
  description: "Connect your existing Humanode OAuth2 Service account to verify.",
  connectMessage: "Connect Account",
};

export const HumanodeOAuth2ServiceProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Biometrics",
    providers: [{ title: "Liveness check", name: "BiometricsLivenessCheck" }],
  },
];
