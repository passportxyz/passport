import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { CivicPassType } from "./Providers/passType";
import { CivicPassProvider } from "./Providers/civic";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/civicStampIcon.svg",
  platform: "Civic",
  name: "Civic",
  description: "Civic Profile Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "CAPTCHA Pass",
    providers: [{ title: "holds a Civic CAPTCHA Pass", name: "CivicCaptchaPass" }],
  },
  {
    platformGroup: "Uniqueness Pass",
    providers: [{ title: "holds a Civic Uniqueness Pass", name: "CivicUniquenessPass" }],
  },
  {
    platformGroup: "Liveness Pass",
    providers: [{ title: "holds a Civic Liveness Pass", name: "CivicLivenessPass" }],
  },
  {
    platformGroup: "IDV Pass",
    providers: [{ title: "holds a Civic IDV Pass", name: "CivicIDVPass" }],
  },
];

/////////////////////////////////////////////////////////////
// Civic Passes: Keep in sync with https://docs.com/integration-guides/civic-idv-services/available-networks
// By default, excludes testnets. To include testnets, add `includeTestnets: true` to each provider.
////////////////////////////////////////////////////////////
export const providers: Provider[] = [
  new CivicPassProvider({
    passTypes: [CivicPassType.CAPTCHA],
    type: "CivicCaptchaPass",
  }),
  new CivicPassProvider({
    passTypes: [CivicPassType.UNIQUENESS],
    type: "CivicUniquenessPass",
  }),
  new CivicPassProvider({
    passTypes: [CivicPassType.LIVENESS],
    type: "CivicLivenessPass",
  }),
  new CivicPassProvider({
    passTypes: [CivicPassType.IDV],
    type: "CivicIDVPass",
  }),
];
