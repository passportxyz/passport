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
  description: "Connect your email to verify Uber trips and Amazon shipments",
  connectMessage: "Connect Account",
  website: "https://www.zk.email/",
  timeToGet: "2-10 min",
  price: "Free",
  guide: [
    {
      type: "steps",
      title: "",
      items: [
        {
          title: "Step 1",
          description: 'Click the "Check Eligibility" button below to kick off the verification process.',
        },
        {
          title: "Step 2",
          description:
            "Login to your Google account and provide ZK Email the permissions to find your Amazon shipping confirmations and Uber receipts while keeping your data private.",
        },
        {
          title: "Step 3",
          description:
            "ZK Email will search your inbox, archive, and tagged emails for evidence of your Amazon and Uber activity, and will assign you credentials based on that usage.",
        },
      ],
    },
    {
      type: "list",
      title: "Important considerations",
      items: [
        "This Stamp uses zero-knowledge proofs to analyze emails without exposing personal data. No personal information or email content is stored or shared",
        "It might take some time to process, so please be patient as we verify your activities",
        "Currently, this feature only works with Gmail. We're working on supporting other email providers",
        "For a faster experience, ZK Email uses remote proving. This means emails confirming Amazon shipments and Uber rides are sent to our servers temporarily and then deleted after the proof is created. We're actively working on local proving to improve privacy",
        "We only search your inbox, archive, and tagged emails. Any deleted emails will not count towards this Stamp",
        "This Stamp only searches for specific Amazon shipping notification and Uber receipt patterns",
        "If you have trouble proving your emails, you can contribute to the public archive of dkim keys at archive.zk.email/contribute",
        "For additional support, contact the team at support@zk.email",
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
        description: `Having received at least ${AMAZON_CASUAL_PURCHASER_THRESHOLD} Amazon shipping emails.`,
      },
      {
        title: "Regular Purchaser",
        name: "ZKEmail#AmazonRegularCustomer",
        description: `Having received at least ${AMAZON_REGULAR_CUSTOMER_THRESHOLD} Amazon shipping emails.`,
      },
      {
        title: "Heavy Purchaser",
        name: "ZKEmail#AmazonHeavyUser",
        description: `Having received at least ${AMAZON_HEAVY_USER_THRESHOLD} Amazon shipping emails.`,
      },
    ],
  },
  {
    platformGroup: "Uber",
    providers: [
      {
        title: "Occasional Rider",
        name: "ZKEmail#UberOccasionalRider",
        description: `Having received at least ${UBER_OCCASIONAL_RIDER_THRESHOLD} Uber ride receipts.`,
      },
      {
        title: "Regular Rider",
        name: "ZKEmail#UberRegularRider",
        description: `Having received at least ${UBER_REGULAR_RIDER_THRESHOLD} Uber rides receipts.`,
      },
      {
        title: "Power User",
        name: "ZKEmail#UberPowerUser",
        description: `Having received at least ${UBER_POWER_USER_THRESHOLD} Uber rides receipts.`,
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
