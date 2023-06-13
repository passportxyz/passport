import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import {
  CyberProfilePremiumProvider,
  CyberProfilePaidProvider,
  CyberProfileFreeProvider,
} from "./Providers/cyberconnect";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/cyberconnectLogoIcon.svg",
  platform: "CyberConnect",
  name: "CyberConnect",
  description: "Connect your wallet to verify your CyberProfile Handle.",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "CyberProfile Handle",
    providers: [
      { title: "Premium CyberProfile Handle ( length is between 1 and 6 characters )", name: "CyberProfilePremium" },
      { title: "Paid CyberProfile Handle ( length is between 7 and 12 characters )", name: "CyberProfilePaid" },
      { title: "Free CyberProfile Handle ( length is between 13 and 20 characters )", name: "CyberProfileFree" },
    ],
  },
];

export const providers: Provider[] = [
  new CyberProfilePremiumProvider(),
  new CyberProfilePaidProvider(),
  new CyberProfileFreeProvider(),
];
