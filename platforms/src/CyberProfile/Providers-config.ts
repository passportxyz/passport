import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { CyberProfilePremiumProvider, CyberProfilePaidProvider } from "./Providers/cyberconnect";
import { CyberProfileOrgMemberProvider } from "./Providers/cyberconnect_nonevm";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/cyberconnectLogoIcon.svg",
  platform: "CyberConnect",
  name: "CyberConnect",
  description: "Connect your Cyberconnect profile.",
  website: "https://cyberconnect.me/",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "CyberProfile Handle",
    providers: [
      { title: "Premium CyberProfile Handle ( length is 6 characters or less )", name: "CyberProfilePremium" },
      { title: "Paid CyberProfile Handle ( length is 12 characters or less )", name: "CyberProfilePaid" },
      { title: "Organization Membership", name: "CyberProfileOrgMember" },
    ],
  },
];

export const providers: Provider[] = [
  new CyberProfilePremiumProvider(),
  new CyberProfilePaidProvider(),
  new CyberProfileOrgMemberProvider(),
];
