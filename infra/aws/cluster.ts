import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { stack, defaultTags } from "../lib/tags";

const containerInsightsStatus = stack == "production" ? "enabled" : "disabled";

//////////////////////////////////////////////////////////////
// ECS Cluster
// can be moved to core infrastructure if it is reused
//////////////////////////////////////////////////////////////

export const cluster = new aws.ecs.Cluster(`gitcoin`, {
  name: `gitcoin`,
  // serviceConnectDefaults: {
  //     namespace : //aws.servicediscovery.HttpNamespace
  // }
  settings: [
    {
      name: "containerInsights",
      value: containerInsightsStatus,
    },
  ],
  tags: {
    ...defaultTags,
    Name: `gitcoin`,
  },
});
