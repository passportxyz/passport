import { PlatformSpec, PlatformGroupSpec } from "../types";

export const MeritProtocolPlatformDetails: PlatformSpec = {
  icon: "./assets/meritProtocolStampIcon.svg",
  platform: "MeritProtocol",
  name: "Merit Protocol",
  description: "Merit Protocol Income Verification",
  connectMessage: "Verify Income",
};

export const MeritProtocolProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Income",
    providers: [
      { title: "At least $10,000 USD", name: "MeritProtocolIncomeGte#10000" },
      { title: "At least $50,000 USD", name: "MeritProtocolIncomeGte#50000" },
      { title: "At least $100,000 USD", name: "MeritProtocolIncomeGte#100000" },
    ],
  },
];
