import { PlatformSpec, PlatformGroupSpec } from "../types";

export const SnapshotPlatformDetails: PlatformSpec = {
  icon: "./assets/snapshotStampIcon.svg",
  platform: "Snapshot",
  name: "Snapshot",
  description: "Connect your existing account to verify with Snapshot.",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const SnapshotProviderConfig: PlatformGroupSpec[] = [
  {
    platformGroup: "Snapshot Voter",
    providers: [{ title: "Voted on 2 or more DAO proposals", name: "SnapshotVotesProvider" }],
  },
  {
    platformGroup: "Snapshot Proposal Creator",
    providers: [
      { title: "Created a DAO proposal that was voted on by at least 1 account", name: "SnapshotProposalsProvider" },
    ],
  },
];
