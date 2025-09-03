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

  // Sync to AWS Secrets Manager, will fetch in lambda
  // Secrets: ALCHEMY_API_KEY, PRIVATE_KEY
  secretsManager.syncSecretsAndGetRefs({
    vault: "DevOps",
    repo: "passport-xyz",
    env: stack,
    section: "sweeper",
    targetSecret: sweeperServiceSecret,
    secretVersionName: "sweeper-secret-version",
  });

  // Only put non-secret environment variables in Lambda
  const variables: Record<string, any> = {
    SECRETS_ARN: sweeperServiceSecret.arn,
    BALANCE_THRESHOLD_ETH: "0.25",
    // These should be chain-specific destination addresses (multisig) for swept funds
    CHAIN_DEPOSIT_ADDRESSES: JSON.stringify(
      stack === "production"
        ? {
            "opt-mainnet": "0xc5093228529547272bE5E58db15a5d36fb2C0424",
            "linea-mainnet": "0x9A40A259B441C942A22227D5D22bA86dD2E7BFe0",
            "arb-mainnet": "0xc5093228529547272bE5E58db15a5d36fb2C0424",
            "zksync-mainnet": "0xC6D1619564DEC7bB5323D6520bfAbCb1b271D26E",
            "scroll-mainnet": "0xc5093228529547272bE5E58db15a5d36fb2C0424",
            "base-mainnet": "0xc5093228529547272bE5E58db15a5d36fb2C0424",
            "shape-mainnet": "0x765c4a537667E04c9bb05E42Ec41eFadc2B7B5bb",
          }
        : stack === "staging"
          ? {
              "opt-sepolia": "0x96DB2c6D93A8a12089f7a6EdA5464e967308AdEd",
            }
          : {
              "eth-sepolia": "0x96DB2c6D93A8a12089f7a6EdA5464e967308AdEd",
            }
    ),
  };

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

  // Add VPC execution policy for Lambda in VPC
  const vpcExecutionPolicy = new aws.iam.RolePolicyAttachment("sweeper-vpc-policy", {
    role: lambdaRole.name,
    policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole,
  });

  // Add policy for accessing secrets manager
  const secretsPolicy = new aws.iam.RolePolicy("sweeper-secrets-policy", {
    role: lambdaRole.id,
    policy: sweeperServiceSecret.arn.apply((secretArn) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["secretsmanager:GetSecretValue"],
            Resource: secretArn,
          },
        ],
      })
    ),
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

  // Create Lambda function - expects the TypeScript to be built in CI
  const sweeperDir = path.join(__dirname, "../scripts/verifier_sweep");
  const ethCheckerFunction = new aws.lambda.Function("sweeper", {
    vpcConfig: {
      subnetIds: vpcPrivateSubnets,
      securityGroupIds: [securityGroup.id],
    },
    role: lambdaRole.arn,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      // Include the built JavaScript files
      ".": new pulumi.asset.FileArchive(path.join(sweeperDir, "dist")),
      // Include node_modules for dependencies
      node_modules: new pulumi.asset.FileArchive(path.join(sweeperDir, "node_modules")),
    }),
    timeout: 600,
    memorySize: 256,
    environment: {
      variables,
    },
  });

  // Create CloudWatch event rule (scheduled trigger)
  const eventRule = new aws.cloudwatch.EventRule("sweeper-schedule", {
    scheduleExpression: stack === "production" ? "rate(1 day)" : "rate(1 hour)",
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
