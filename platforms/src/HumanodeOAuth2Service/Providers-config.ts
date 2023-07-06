import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { BiometricsLivenessCheckProvider } from "./Providers/BiometricsLivenessCheckProvider";

export const PlatformDetails: PlatformSpec = {
  platform: "HumanodeOAuth2Service",
  name: "BiometricsLivenessCheck",
  description: "Connect your existing Humanode OAuth2 Service account to verify.",
  connectMessage: "Connect Account",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Biometrics",
    providers: [{ title: "Liveness check", name: "BiometricsLivenessCheck" }],
  },
];

export const providers: Provider[] = [new BiometricsLivenessCheckProvider()];
