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
      { title: "Premium CyberProfile Handle ( length is between 1 and 6 characters )", name: "CyberProfilePremium" },
      { title: "Paid CyberProfile Handle ( length is between 7 and 12 characters )", name: "CyberProfilePaid" },
      { title: "Organization Membership", name: "CyberProfileOrgMember" },
    ],
  },
];

export const providers: Provider[] = [
  new CyberProfilePremiumProvider(),
  new CyberProfilePaidProvider(),
  new CyberProfileOrgMemberProvider(),
];
