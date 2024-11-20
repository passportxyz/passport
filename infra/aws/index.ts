import * as pulumi from "@pulumi/pulumi";
import { cluster } from "./cluster";
import * as iam from "./iam";
import * as embed from "./embed";

// Passport Cluster
export const passportClusterArn = cluster.arn;
export const passportClusterName = cluster.name;

// IAM
export const amplifyAppHookUrl = pulumi.secret(iam.amplifyAppInfo.webHook.url);
export const passportIamServiceName = iam.passportXyzService.name;

// Embed
export const passportEmbedServiceName = embed.passportEmbedService.name;
