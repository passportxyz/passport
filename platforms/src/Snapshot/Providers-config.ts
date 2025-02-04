import { PlatformSpec, PlatformGroupSpec, Provider } from "../types.js";
import { SnapshotProposalsProvider } from "./Providers/index.js";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/snapshotStampIcon.svg",
  platform: "Snapshot",
  name: "Snapshot",
  description: "Connect to Snapshot to verify your DAO voting power.",
  connectMessage: "Verify Account",
  isEVM: true,
  website: "https://snapshot.org/",
};

export const ProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Snapshot Proposal Creator",
    providers: [
      { title: "Created a DAO proposal that was voted on by at least 1 account", name: "SnapshotProposalsProvider" },
    ],
  },
];

export const providers: Provider[] = [new SnapshotProposalsProvider()];
