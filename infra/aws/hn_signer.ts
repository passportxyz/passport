import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import * as op from "@1password/op-js";

import { cluster } from "./cluster";
import { stack, defaultTags } from "../lib/tags";

import {
  vpcId,
  vpcPrivateSubnets,
  privateAlbArn,
  privateAlbArnSuffix,
  privateAlbRoute53Record,
  snsAlertsTopicArn,
} from "./stacks";

const PASSPORT_VC_SECRETS_ARN = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/PASSPORT_VC_SECRETS_ARN`);

const logsRetention = Object({
  review: 1,
  staging: 7,
  production: 14,
});

// Define resource sizing by environment
const hnSignerResources: Record<string, any> = {
  review: {
    cpu: "256",
    memory: "512",
    desiredCount: 1,
    maxCapacity: 2,
  },
  staging: {
    cpu: "512",
    memory: "1024",
    desiredCount: 1,
    maxCapacity: 4,
  },
  production: {
    cpu: "1024",
    memory: "2048",
    desiredCount: 2,
    maxCapacity: 8,
  },
};

// Docker image reference
export const dockerHnSignerImage = `mishtinetwork/signer:latest`;

// Create IAM role for ECS task
const hnSignerRole = new aws.iam.Role("hn-signer-ecs-role", {
  name: `hn-signer-ecs-role`,
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "ecs-tasks.amazonaws.com",
        },
      },
    ],
  }),
  inlinePolicies: [
    {
      name: "hn_signer_secrets_policy",
      policy: pulumi.interpolate`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "secretsmanager:GetSecretValue"
          ],
          "Resource": "${PASSPORT_VC_SECRETS_ARN}"
        }
      ]
    }`,
    },
  ],
  managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"],
  tags: defaultTags,
});

// Create security group for HN Signer
const hnSignerSG = new aws.ec2.SecurityGroup("hn-signer", {
  name: `passport-hn-signer`,
  vpcId: vpcId,
  ingress: [
    {
      fromPort: 3000,
      toPort: 3000,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/8"], // Internal VPC only
      description: "Allow HTTP from internal ALB",
    },
  ],
  egress: [
    {
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow all outbound",
    },
  ],
  tags: defaultTags,
});

// CloudWatch log group
const hnSignerLogGroup = new aws.cloudwatch.LogGroup("hn-signer", {
  name: `/passport/hn-signer`,
  retentionInDays: logsRetention[stack],
  tags: defaultTags,
});

// ECS Task Definition
const hnSignerTaskDefinition = new aws.ecs.TaskDefinition("hn-signer", {
  family: `passport-hn-signer`,
  requiresCompatibilities: ["FARGATE"],
  networkMode: "awsvpc",
  cpu: hnSignerResources[stack]["cpu"],
  memory: hnSignerResources[stack]["memory"],
  executionRoleArn: hnSignerRole.arn,
  taskRoleArn: hnSignerRole.arn,
  containerDefinitions: pulumi.all([dockerHnSignerImage, hnSignerLogGroup.name]).apply(([imageUri, logGroupName]) =>
    JSON.stringify([
      {
        name: "hn-signer",
        image: imageUri,
        essential: true,
        portMappings: [
          {
            containerPort: 3000,
            hostPort: 3000,
            protocol: "tcp",
          },
        ],
        environment: [
          {
            name: "ALLOWED_METHODS",
            value: "OPRFSecp256k1",
          },
          {
            name: "MISHTI_RPC_URL",
            value: "http://44.217.242.218:8081/",
          },
          {
            name: "RATE_LIMIT_ENABLED",
            value: "false",
          },
          {
            name: "SIGNER_ENV",
            value: stack === "review" ? "dev" : "prod",
          },
          {
            name: "SIGNER_PORT",
            value: "3000",
          },
        ],
        secrets: [
          {
            name: "MISHTI_SIGNER_PRIVATE_KEY",
            valueFrom: `${PASSPORT_VC_SECRETS_ARN}:HUMAN_NETWORK_CLIENT_PRIVATE_KEY::`,
          },
        ],
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": "/passport/hn-signer",
            "awslogs-region": "us-west-2",
            "awslogs-create-group": "true",
            "awslogs-stream-prefix": "ecs",
          },
        },
      },
    ])
  ),
  tags: defaultTags,
});

// Target Group for Private ALB
const hnSignerTargetGroup = new aws.lb.TargetGroup("hn-signer", {
  name: `passport-hn-signer`,
  vpcId: vpcId,
  port: 3000,
  protocol: "HTTP",
  targetType: "ip",
  healthCheck: {
    enabled: true,
    path: "/",
    port: "3000",
    protocol: "HTTP",
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 5,
    matcher: "200-499",
  },
  tags: defaultTags,
});

// Create a new listener on port 86 for HN Signer
const hnSignerListener = new aws.lb.Listener("hn-signer-port-86", {
  loadBalancerArn: privateAlbArn,
  port: 86,
  protocol: "HTTP",
  defaultActions: [
    {
      type: "forward",
      targetGroupArn: hnSignerTargetGroup.arn,
    },
  ],
  tags: defaultTags,
});

// ECS Service
const hnSignerService = new aws.ecs.Service("hn-signer", {
  name: `passport-hn-signer`,
  cluster: cluster.arn,
  taskDefinition: hnSignerTaskDefinition.arn,
  launchType: "FARGATE",
  desiredCount: hnSignerResources[stack]["desiredCount"],
  networkConfiguration: {
    subnets: vpcPrivateSubnets,
    securityGroups: [hnSignerSG.id],
    assignPublicIp: false,
  },
  loadBalancers: [
    {
      targetGroupArn: hnSignerTargetGroup.arn,
      containerName: "hn-signer",
      containerPort: 3000,
    },
  ],
  tags: defaultTags,
});

// Auto Scaling Target
const hnSignerAutoScalingTarget = new aws.appautoscaling.Target("hn-signer", {
  maxCapacity: hnSignerResources[stack]["maxCapacity"],
  minCapacity: 1,
  resourceId: pulumi.interpolate`service/${cluster.name}/${hnSignerService.name}`,
  scalableDimension: "ecs:service:DesiredCount",
  serviceNamespace: "ecs",
  tags: defaultTags,
});

// Auto Scaling Policy
const hnSignerAutoScalingPolicy = new aws.appautoscaling.Policy("hn-signer", {
  name: `passport-hn-signer`,
  policyType: "TargetTrackingScaling",
  resourceId: hnSignerAutoScalingTarget.resourceId,
  scalableDimension: hnSignerAutoScalingTarget.scalableDimension,
  serviceNamespace: hnSignerAutoScalingTarget.serviceNamespace,
  targetTrackingScalingPolicyConfiguration: {
    predefinedMetricSpecification: {
      predefinedMetricType: "ECSServiceAverageCPUUtilization",
    },
    targetValue: 70.0,
    scaleOutCooldown: 300,
    scaleInCooldown: 300,
  },
});

// CloudWatch Alarms for monitoring
const hnSignerErrorAlarm = new aws.cloudwatch.MetricAlarm("hn-signer-errors", {
  name: `passport-hn-signer-errors`,
  comparisonOperator: "GreaterThanThreshold",
  evaluationPeriods: 2,
  metricName: "HTTPCode_Target_5XX_Count",
  namespace: "AWS/ApplicationELB",
  period: 300,
  statistic: "Sum",
  threshold: 10,
  alarmDescription: "HN Signer service 5XX errors",
  dimensions: {
    TargetGroup: hnSignerTargetGroup.arnSuffix,
    LoadBalancer: privateAlbArnSuffix,
  },
  alarmActions: [snsAlertsTopicArn],
  tags: defaultTags,
});

// Outputs
export const hnSignerServiceName = hnSignerService.name;
export const hnSignerTargetGroupArn = hnSignerTargetGroup.arn;
export const hnSignerSecurityGroupId = hnSignerSG.id;
export const hnSignerListenerArn = hnSignerListener.arn;

// Export internal endpoint for other services to use
// Using port 86 for direct routing without path prefix
export const hnSignerInternalUrl = pulumi.interpolate`http://${privateAlbRoute53Record}:86`;
