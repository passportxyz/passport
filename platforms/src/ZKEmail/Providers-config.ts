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
  description: "Connect to your email to verify you took Uber trips and Amazon orders.",
  connectMessage: "Connect Account",
  website: "https://www.zk.email/",
  timeToGet: "2-5 min",
  price: "Free",
  guide: [
    {
      type: "list",
      title: "Important Considerations",
      items: [
        "Currently, this feature only works with Gmail. We're working on supporting other email providers.",
        "You'll need to log in with your Google account to verify your purchases on Uber and Amazon.",
        "For a faster experience, ZK Email uses remote proving. This means emails confirming Amazon purchases and Uber rides are sent to our servers temporarily and then deleted after the proof is created. We're actively working on local proving to improve privacy.",
      ],
    },
    {
      type: "steps",
      title: "Troubleshooting Email Verification",
      items: [
        {
          title: "Contribute to the DKIM Archive",
          description:
            "Help strengthen email verification by contributing missing public keys to the public DKIM Archive.",
          actions: [
            {
              label: "Contribute to the DKIM Archive",
              href: "https://archive.zk.email/contribute",
            },
          ],
        },
        {
          title: "Contact Support",
          description:
            "If you're still having issues, our support team is here to help. Providing an email example (.eml file) will help us resolve your issue faster.",
          actions: [
            {
              label: "Learn how to download an .eml file",
              href: "https://docs.zk.email/zk-email-sdk/get-eml-file",
            },
            {
              label: "Contact Support",
              href: "mailto:support@zk.email",
            },
          ],
        },
      ],
    },
  ],
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
        description: `Having made at least ${UBER_OCCASIONAL_RIDER_THRESHOLD} Uber rides.`,
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
