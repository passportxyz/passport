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

  return logGroup;
}
