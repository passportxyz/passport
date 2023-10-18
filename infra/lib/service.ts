import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export function createPagerdutyTopic(): aws.sns.Topic {
  const pagerdutyTopic = new aws.sns.Topic("pagerduty", {
    name: "Pagerduty",
  });

  const PAGERDUTY_INTEGRATION_ENDPOINT = pulumi.secret(`${process.env["PAGERDUTY_INTEGRATION_ENDPOINT"]}`);

  const identity = aws.getCallerIdentity();

  const pagerdutyTopicPolicy = new aws.sns.TopicPolicy("pagerdutyTopicPolicy", {
    arn: pagerdutyTopic.arn,
    policy: pagerdutyTopic.arn.apply((arn) =>
      identity.then(({ accountId }) =>
        JSON.stringify({
          Id: "__default_policy_ID",
          Statement: [
            {
              Action: [
                "SNS:GetTopicAttributes",
                "SNS:SetTopicAttributes",
                "SNS:AddPermission",
                "SNS:RemovePermission",
                "SNS:DeleteTopic",
                "SNS:Subscribe",
                "SNS:ListSubscriptionsByTopic",
                "SNS:Publish",
              ],
              Condition: {
                StringEquals: { "AWS:SourceOwner": accountId },
              },
              Effect: "Allow",
              Principal: { AWS: "*" },
              Resource: arn,
              Sid: "__default_statement_ID",
            },
          ],
          Version: "2008-10-17",
        })
      )
    ),
  });

  const pagerdutySubscription = new aws.sns.TopicSubscription("pagerdutySubscription", {
    endpoint: PAGERDUTY_INTEGRATION_ENDPOINT,
    protocol: "https",
    topic: pagerdutyTopic.arn,
  });

  return pagerdutyTopic;
}

export function createIAMLogGroup({ alertTopic }: { alertTopic: aws.sns.Topic }): aws.cloudwatch.LogGroup {
  const logGroup = new aws.cloudwatch.LogGroup("dpopp-iam", {
    retentionInDays: 1,
  });

  const unhandledErrorsMetric = new aws.cloudwatch.LogMetricFilter("unhandledErrorsMetric", {
    logGroupName: logGroup.name,
    metricTransformation: {
      defaultValue: "0",
      name: "providerError",
      namespace: "/iam/errors/unhandled",
      unit: "Count",
      value: "1",
    },
    name: "Unhandled Provider Errors",
    pattern: '"UNHANDLED ERROR:" type address',
  });

  const unhandledErrorsAlarm = new aws.cloudwatch.MetricAlarm("unhandledErrorsAlarm", {
    alarmActions: [alertTopic.arn],
    comparisonOperator: "GreaterThanOrEqualToThreshold",
    datapointsToAlarm: 1,
    evaluationPeriods: 1,
    insufficientDataActions: [],
    metricName: "providerError",
    name: "Unhandled Provider Errors",
    namespace: "/iam/errors/unhandled",
    okActions: [],
    period: 21600,
    statistic: "Sum",
    threshold: 1,
    treatMissingData: "notBreaching",
  });

  new aws.cloudwatch.LogMetricFilter("redisConnectionErrors", {
    logGroupName: logGroup.name,
    metricTransformation: {
      defaultValue: "0",
      name: "redisConnectionError",
      namespace: "/iam/errors/redis",
      unit: "Count",
      value: "1",
    },
    name: "Redis Connection Error",
    pattern: '"REDIS CONNECTION ERROR:"',
  });

  new aws.cloudwatch.MetricAlarm("redisConnectionErrorsAlarm", {
    alarmActions: [alertTopic.arn],
    comparisonOperator: "GreaterThanOrEqualToThreshold",
    datapointsToAlarm: 1,
    evaluationPeriods: 1,
    insufficientDataActions: [],
    metricName: "redisConnectionError",
    name: "Redis Connection Error",
    namespace: "/iam/errors/redis",
    okActions: [],
    period: 21600,
    statistic: "Sum",
    threshold: 1,
    treatMissingData: "notBreaching",
  });

  return logGroup;
}

export function setupRedis(vpcPrivateSubnetIds: any, vpc: aws.ec2.Vpc) {
  //////////////////////////////////////////////////////////////
  // Set up Redis
  //////////////////////////////////////////////////////////////

  const redisSubnetGroup = new aws.elasticache.SubnetGroup("passport-redis-subnet", {
    subnetIds: vpcPrivateSubnetIds,
  });

  const secgrp_redis = new aws.ec2.SecurityGroup("passport-redis-secgrp", {
    description: "passport-redis-secgrp",
    vpcId: vpc.vpcId,
    ingress: [
      {
        protocol: "tcp",
        fromPort: 6379,
        toPort: 6379,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
      },
    ],
  });

  const redis = new aws.elasticache.Cluster("passport-redis", {
    engine: "redis",
    engineVersion: "4.0.10",
    nodeType: "cache.t2.small",
    numCacheNodes: 1,
    port: 6379,
    subnetGroupName: redisSubnetGroup.name,
    securityGroupIds: [secgrp_redis.id],
  });

  const redisPrimaryNode = redis.cacheNodes[0];

  const redisCacheOpsConnectionUrl = pulumi.interpolate`redis://${redisPrimaryNode.address}:${redisPrimaryNode.port}/0`;

  return redisCacheOpsConnectionUrl;
}
