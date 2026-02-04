import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as op from "@1password/op-js";
import * as path from "path";
import { vpcId, vpcPrivateSubnets, snsAlertsTopicArn } from "../aws/stacks";
import { stack, defaultTags } from "./tags";

const PASSPORT_VC_SECRETS_ARN = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/PASSPORT_VC_SECRETS_ARN`);

const CREDITS_THRESHOLD = "500000";
const ETH_RPC_URL = "https://eth.llamarpc.com";

export const createAutoCreditsService = async () => {
  // Only run in production - other environments don't have the HN private key
  if (stack !== "production") {
    return;
  }

  const variables: Record<string, any> = {
    PASSPORT_VC_SECRETS_ARN: PASSPORT_VC_SECRETS_ARN,
    CREDITS_THRESHOLD,
    ETH_RPC_URL,
  };

  // Create IAM role for the Lambda
  const lambdaRole = new aws.iam.Role("auto-credits-role", {
    name: "auto-credits-role",
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
        },
      ],
    }),
    inlinePolicies: [
      {
        name: "auto_credits_vc_secrets_policy",
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["secretsmanager:GetSecretValue"],
              Resource: PASSPORT_VC_SECRETS_ARN,
            },
          ],
        }),
      },
    ],
    managedPolicyArns: [
      aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
      aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole,
    ],
  });

  const securityGroup = new aws.ec2.SecurityGroup("auto-credits-sg", {
    name: "auto-credits-sg",
    vpcId,
    tags: {
      ...defaultTags,
      Name: "auto-credits-sg",
    },
  });

  new aws.ec2.SecurityGroupRule("auto-credits-sg-egress", {
    securityGroupId: securityGroup.id,
    type: "egress",
    fromPort: 0,
    toPort: 0,
    protocol: "-1",
    cidrBlocks: ["0.0.0.0/0"],
  });

  // Create Lambda function
  const autoCreditsDir = path.join(__dirname, "../scripts/auto_credits");
  const autoCreditsFunction = new aws.lambda.Function("auto-credits", {
    vpcConfig: {
      subnetIds: vpcPrivateSubnets,
      securityGroupIds: [securityGroup.id],
    },
    role: lambdaRole.arn,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    code: new pulumi.asset.FileArchive(path.join(autoCreditsDir, "dist")),
    timeout: 120,
    memorySize: 256,
    environment: {
      variables,
    },
  });

  // Create CloudWatch event rule - run once per day
  const eventRule = new aws.cloudwatch.EventRule("auto-credits-schedule", {
    scheduleExpression: "rate(1 day)",
  });

  // Connect event rule to Lambda
  new aws.lambda.Permission("auto-credits-permission", {
    action: "lambda:InvokeFunction",
    function: autoCreditsFunction.name,
    principal: "events.amazonaws.com",
    sourceArn: eventRule.arn,
  });

  new aws.cloudwatch.EventTarget("auto-credits-target", {
    rule: eventRule.name,
    arn: autoCreditsFunction.arn,
  });

  // Alert on Lambda errors (includes insufficient ETH, tx failures, etc.)
  new aws.cloudwatch.MetricAlarm("auto-credits-errors", {
    name: "auto-credits-errors",
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "Errors",
    namespace: "AWS/Lambda",
    period: 86400, // 1 day (matches schedule)
    statistic: "Sum",
    threshold: 0,
    alarmDescription: "Auto-credits Lambda failed - may be out of ETH for gas",
    dimensions: {
      FunctionName: autoCreditsFunction.name,
    },
    alarmActions: [snsAlertsTopicArn],
    tags: defaultTags,
  });

  return {
    functionName: autoCreditsFunction.name,
    functionArn: autoCreditsFunction.arn,
  };
};
