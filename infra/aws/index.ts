import * as pulumi from "@pulumi/pulumi";
import { cluster } from "./cluster";
import * as iam from "./iam";
import * as embed from "./embed";
import * as hnSigner from "./hn_signer";

// Passport Cluster
export const passportClusterArn = cluster.arn;
export const passportClusterName = cluster.name;

// IAM
export const passportIamServiceName = iam.passportXyzService.name;

// Embed
export const passportEmbedServiceName = embed.passportEmbedService.name;

// HN Signer
export const hnSignerServiceName = hnSigner.hnSignerServiceName;
export const hnSignerInternalUrl = hnSigner.hnSignerInternalUrl;

// Re-export downstream-needed core-infra outputs as this stack's own outputs
// so post-deploy S3 sync workflows can read them locally instead of cross-
// cloning core-infra (the default GITHUB_TOKEN is repo-scoped and would fail).
export {
  passportAppBucketName,
  passportAppDistributionId,
  embedPopupBucketName,
  embedPopupDistributionId,
} from "./stacks";
