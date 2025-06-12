import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import { secretsManager } from "@gitcoin/passport-infra-libs";

import {
  stack,
  current,
  regionData,
  cluster,
  vpcId,
  vpcPrivateSubnets,
  logsRetention,
  snsTopic,
  DOCKER_IMAGE_TAG,
  privateAlbHttpListenerArn,
  privateAlbArnSuffix,
  privateAlbRoute53Record,
} from "./stacks";

import { op } from "@1password/op-js";

const PASSPORT_VC_SECRETS_ARN = op.read.parse(`op://DevOps/passport-xyz-${stack}-env/ci/PASSPORT_VC_SECRETS_ARN`);

// Get HN Signer environment variables from 1Password
const hnSignerEnvironment = secretsManager.getEnvironmentVars({
  vault: "DevOps",
  repo: "passport-xyz",
  env: stack,
  section: "hn-signer",
});

const defaultTags = {
  ManagedBy: "pulumi",
  Environment: stack,
  Application: "passport",
  PulumiStack: pulumi.getStack(),
};

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
export const dockerHnSignerImage = pulumi
  .all([current, regionData])
  .apply(([acc, region]) => `mishtinetwork/signer:latest`);

// Create IAM role for ECS task
const hnSignerRole = new aws.iam.Role("hn-signer-ecs-role", {
  name: `hn-signer-ecs-role-${stack}`,
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
  inlinePolicies: {
    PassportVCSecretsPolicy: pulumi.interpolate`{
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
  managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"],
  tags: defaultTags,
});

// Create security group for HN Signer
const hnSignerSG = new aws.ec2.SecurityGroup("hn-signer", {
  name: `passport-hn-signer-${stack}`,
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
  name: `/passport/${stack}/hn-signer`,
  retentionInDays: logsRetention[stack],
  tags: defaultTags,
});

// ECS Task Definition
const hnSignerTaskDefinition = new aws.ecs.TaskDefinition("hn-signer", {
  family: `passport-hn-signer-${stack}`,
  requiresCompatibilities: ["FARGATE"],
  networkMode: "awsvpc",
  cpu: hnSignerResources[stack]["cpu"],
  memory: hnSignerResources[stack]["memory"],
  executionRoleArn: hnSignerRole.arn,
  taskRoleArn: hnSignerRole.arn,
  containerDefinitions: pulumi
    .all([dockerHnSignerImage, hnSignerLogGroup.name, hnSignerEnvironment])
    .apply(([imageUri, logGroupName, envVars]) =>
      JSON.stringify([
        {
          name: "hn-signer",
          image: imageUri,
          essential: true,
          portMappings: [
            {
              containerPort: 3000,
              protocol: "tcp",
            },
          ],
          environment: [
            ...envVars,
            {
              name: "SIGNER_ENV",
              value: stack === "review" ? "dev" : "prod",
            },
            {
              name: "SIGNER_PORT",
              value: "3000",
            },
            {
              name: "RATE_LIMIT_ENABLED",
              value: "false",
            },
            {
              name: "ALLOWED_METHODS",
              value: "OPRFSecp256k1",
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
              "awslogs-group": logGroupName,
              "awslogs-region": regionData.name,
              "awslogs-stream-prefix": "ecs",
            },
          },
          healthCheck: {
            command: ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
          },
        },
      ])
    ),
  tags: defaultTags,
});

// Target Group for Private ALB
const hnSignerTargetGroup = new aws.lb.TargetGroup("hn-signer", {
  name: `passport-hn-signer-${stack}`,
  vpcId: vpcId,
  port: 3000,
  protocol: "HTTP",
  targetType: "ip",
  healthCheck: {
    enabled: true,
    path: "/health",
    port: "3000",
    protocol: "HTTP",
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 5,
    matcher: "200",
  },
  tags: defaultTags,
});

// Private ALB Listener Rule for path-based routing
const hnSignerListenerRule = new aws.lb.ListenerRule("hn-signer-private", {
  listenerArn: privateAlbHttpListenerArn,
  priority: 100, // Higher priority than data science service
  actions: [
    {
      type: "forward",
      targetGroupArn: hnSignerTargetGroup.arn,
    },
  ],
  conditions: [
    {
      pathPattern: {
        values: ["/hn-signer/*"],
      },
    },
  ],
  tags: defaultTags,
});

// ECS Service
const hnSignerService = new aws.ecs.Service("hn-signer", {
  name: `passport-hn-signer-${stack}`,
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
  name: `passport-hn-signer-${stack}`,
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
  name: `passport-hn-signer-${stack}-errors`,
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
  alarmActions: [snsTopic],
  tags: defaultTags,
});

// Outputs
export const hnSignerServiceName = hnSignerService.name;
export const hnSignerTargetGroupArn = hnSignerTargetGroup.arn;
export const hnSignerSecurityGroupId = hnSignerSG.id;
export const hnSignerListenerRuleArn = hnSignerListenerRule.arn;

// Export internal endpoint for other services to use
export const hnSignerInternalUrl = pulumi.interpolate`http://${privateAlbRoute53Record}/hn-signer`;
