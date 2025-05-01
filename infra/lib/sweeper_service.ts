import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";
import { secretsManager } from "infra-libs";
import { vpcId, vpcPrivateSubnets } from "../aws/stacks";

export const createSweeperService = async ({
  stack,
  defaultTags,
}: {
  stack: string;
  defaultTags: { [key: string]: string };
}) => {
  const sweeperServiceSecret = new aws.secretsmanager.Secret("sweeper-secret", {
    name: "sweeper-secret",
    description: "Secrets for the sweeper service",
    tags: {
      ...defaultTags,
      Name: "sweeper-secret",
    },
  });

  const secretMeta = {
    vault: "DevOps",
    repo: "passport-xyz",
    env: stack,
    section: "sweeper",
  };

  // Sync to AWS Secrets Manager, will fetch in lambda
  secretsManager.syncSecretsAndGetRefs({
    ...secretMeta,
    targetSecret: sweeperServiceSecret,
    secretVersionName: "sweeper-secret-version",
  });

  const environment = secretsManager.getEnvironmentVars(secretMeta);
  const variables = environment.reduce((acc, { name, value }) => {
    acc[name] = value;
    return acc;
  }, {});
  variables["SECRETS_ARN"] = sweeperServiceSecret.arn;

  // Create IAM role for the Lambda
  const lambdaRole = new aws.iam.Role("sweeper-role", {
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
  });

  // Attach basic Lambda execution policy
  const lambdaPolicy = new aws.iam.RolePolicyAttachment("sweeper-policy", {
    role: lambdaRole.name,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
  });

  const securityGroup = new aws.ec2.SecurityGroup("sweeper-sg", {
    name: "sweeper-sg",
    vpcId,
    tags: {
      ...defaultTags,
      Name: `sweeper-sg`,
    },
  });

  const sgEgressRule = new aws.ec2.SecurityGroupRule("sweeper-sg-egress", {
    securityGroupId: securityGroup.id,
    type: "egress",
    fromPort: 0,
    toPort: 0,
    protocol: "-1",
    cidrBlocks: ["0.0.0.0/0"],
  });

  // Create Lambda function
  const ethCheckerFunction = new aws.lambda.Function("sweeper", {
    vpcConfig: {
      subnetIds: vpcPrivateSubnets,
      securityGroupIds: [securityGroup.id],
    },
    role: lambdaRole.arn,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      ".": new pulumi.asset.FileArchive(path.join(__dirname, "dist")),
    }),
    timeout: 600,
    memorySize: 256,
    environment: {
      variables,
    },
  });

  // Create CloudWatch event rule (scheduled trigger)
  const eventRule = new aws.cloudwatch.EventRule("sweeper-schedule", {
    scheduleExpression: "rate(10 minutes)",
  });

  // Connect event rule to Lambda
  const lambdaPermission = new aws.lambda.Permission("sweeper-permission", {
    action: "lambda:InvokeFunction",
    function: ethCheckerFunction.name,
    principal: "events.amazonaws.com",
    sourceArn: eventRule.arn,
  });

  const eventTarget = new aws.cloudwatch.EventTarget("sweeper-target", {
    rule: eventRule.name,
    arn: ethCheckerFunction.arn,
  });
};
