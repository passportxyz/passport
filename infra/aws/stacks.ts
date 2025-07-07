import * as pulumi from "@pulumi/pulumi";
import { stack } from "../lib/tags";

const coreInfraStack = new pulumi.StackReference(`passportxyz/core-infra/${stack}`);

export const vpcId = coreInfraStack.getOutput("vpcId");
export const vpcPrivateSubnets = coreInfraStack.getOutput("privateSubnetIds");
export const redisConnectionUrl = pulumi.interpolate`${coreInfraStack.getOutput("staticRedisConnectionUrl")}`;

// Public ALB Data
export const albDnsName = coreInfraStack.getOutput("coreAlbDns");
export const albZoneId = coreInfraStack.getOutput("coreAlbZoneId");
export const albHttpsListenerArn = coreInfraStack.getOutput("coreAlbHttpsListenerArn");
export const coreAlbArn = coreInfraStack.getOutput("coreAlbArn");

// Private ALB Data (for internal services)
export const privateAlbArn = coreInfraStack.getOutput("privateAlbArn");
export const privateAlbArnSuffix = coreInfraStack.getOutput("privateAlbArnSuffix");
export const privateAlbDns = coreInfraStack.getOutput("privateAlbDns");
export const privateAlbZoneId = coreInfraStack.getOutput("privateAlbZoneId");
export const privateAlbHttpListenerArn = coreInfraStack.getOutput("privateAlbHttpListenerArn");
export const privateAlbRoute53Record = coreInfraStack.getOutput("privateAlbRoute53Record");

export const passportDataScienceStack = new pulumi.StackReference(`passportxyz/passport-data/${stack}`);
export const passportDataScienceEndpoint = passportDataScienceStack.getOutput("internalAlbBaseUrl");

export const snsAlertsTopicArn = coreInfraStack.getOutput("snsAlertsTopicArn");

export const passportXyzDomainName = coreInfraStack.getOutput("passportXyzDomainName");
export const passportXyzHostedZoneId = coreInfraStack.getOutput("passportXyzHostedZoneId");
