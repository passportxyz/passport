import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { SnapshotProposalsProvider, SnapshotVotesProvider } from "./Providers";

export const PlatformDetails: PlatformSpec = {
  icon: "./assets/snapshotStampIcon.svg",
  platform: "Snapshot",
  name: "Snapshot",
  description: "Connect your existing account to verify with Snapshot.",
  connectMessage: "Verify Account",
  isEVM: true,
};

export const ProviderConfig: PlatformGroupSpec[] = [
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

export const providers: Provider[] = [new SnapshotVotesProvider(), new SnapshotProposalsProvider()];
