import { PlatformSpec, PlatformGroupSpec } from "../types";

export const CivicPlatformDetails: PlatformSpec = {
  icon: "./assets/civicStampIcon.svg",
  platform: "Civic",
  name: "Civic",
  description: "Civic Profile Verification",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const CivicProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Civic Pass",
    providers: [
      { title: "holds a Civic CAPTCHA Pass", name: "CivicCaptchaPass" },
      { title: "holds a Civic Uniqueness Pass", name: "CivicUniquenessPass" },
      { title: "holds a Civic Liveness Pass", name: "CivicLivenessPass" },
      { title: "holds a Civic IDV Pass", name: "CivicIDVPass" },
    ],
  },
];
