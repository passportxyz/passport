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
