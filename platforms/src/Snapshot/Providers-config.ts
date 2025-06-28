import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { SnapshotProposalsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/snapshotStampIcon.svg",
  platform: "Snapshot",
  name: "Snapshot",
  description: "Verify your DAO governance participation",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://snapshot.org/",
  timeToGet: "1 minute",
  price: "Free",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "DAO Governance",
    providers: [
      {
        title: "Proposal Creator",
        description:
          "Created DAO proposals that received community votes, demonstrating active governance participation",
        name: "SnapshotProposalsProvider",
      },
    ],
  },
];

export const providers: Provider[] = [new SnapshotProposalsProvider()];
