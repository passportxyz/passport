import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import {
  AmazonCasualPurchaserProvider,
  AmazonRegularCustomerProvider,
  AmazonHeavyUserProvider,
  UberOccasionalRiderProvider,
  UberRegularRiderProvider,
  UberPowerUserProvider,
} from "./Providers/zkemail.js";
import {
  AMAZON_CASUAL_PURCHASER_THRESHOLD,
  AMAZON_HEAVY_USER_THRESHOLD,
  AMAZON_REGULAR_CUSTOMER_THRESHOLD,
  UBER_OCCASIONAL_RIDER_THRESHOLD,
  UBER_POWER_USER_THRESHOLD,
  UBER_REGULAR_RIDER_THRESHOLD,
} from "./types.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/zkemailStampIcon.svg",
  platform: "ZKEmail",
  name: "ZK Email",
  description: "Connect to ZK Email to verify you took Uber trips and Amazon orders.",
  connectMessage: "Connect Account",
  website: "https://www.zk.email/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Amazon",
    providers: [
      {
        title: "Casual Purchaser",
        name: "ZKEmail#AmazonCasualPurchaser",
        description: `Having made at least ${AMAZON_CASUAL_PURCHASER_THRESHOLD} Amazon purchase.`,
      },
      {
        title: "Regular Purchaser",
        name: "ZKEmail#AmazonRegularCustomer",
        description: `Having made at least ${AMAZON_REGULAR_CUSTOMER_THRESHOLD} Amazon purchases.`,
      },
      {
        title: "Heavy Purchaser",
        name: "ZKEmail#AmazonHeavyUser",
        description: `Having made at least ${AMAZON_HEAVY_USER_THRESHOLD} Amazon purchases.`,
      },
    ],
  },
  {
    platformGroup: "Uber",
    providers: [
      {
        title: "Occasional Rider",
        name: "ZKEmail#UberOccasionalRider",
        description: `Having made at least ${UBER_OCCASIONAL_RIDER_THRESHOLD} Uber ride.`,
      },
      {
        title: "Regular Rider",
        name: "ZKEmail#UberRegularRider",
        description: `Having made at least ${UBER_REGULAR_RIDER_THRESHOLD} Uber rides.`,
      },
      {
        title: "Power User",
        name: "ZKEmail#UberPowerUser",
        description: `Having made at least ${UBER_POWER_USER_THRESHOLD} Uber rides.`,
      },
    ],
  },
];

export const providers: Provider[] = [
  new AmazonCasualPurchaserProvider(),
  new AmazonRegularCustomerProvider(),
  new AmazonHeavyUserProvider(),
  new UberOccasionalRiderProvider(),
  new UberRegularRiderProvider(),
  new UberPowerUserProvider(),
];
